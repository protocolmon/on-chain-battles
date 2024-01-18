import "isomorphic-unfetch";

import fs from "fs";
import path from "path";
import { ethers } from "hardhat";
import {
  Address,
  createWalletClient,
  http,
  publicActions,
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polychainMonstersTestnet } from "./chain";
import { MatchMakerV2 } from "../typechain-types";
import contractApiAbi from "../artifacts/contracts/api/ContractApiV1.sol/ContractApiV1.json";
import matchMakerAbi from "../artifacts/contracts/MatchMakerV2.sol/MatchMakerV2.json";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const supportedMoves = [
  "DamageOverTimeMove",
  "ControlMove",
  "PurgeBuffsMove",
  "WallBreakerMove",
  "CleansingShieldMove",
  "CloudCoverMove",
  "ElementalWallMove",
  "TailwindMove",
  "AttackAuraMove",
  "DefenseAuraMove",
  "HealMove",
  "SpeedAuraMove",
];

const getRandomMove = () => {
  const max = OFFENSE_ONLY ? 4 : supportedMoves.length;
  const randomIndex = Math.floor(Math.random() * max);
  return supportedMoves[randomIndex];
};

export const getCommitHash = (move: string, secret: string = "secret") =>
  ethers.solidityPackedKeccak256(
    ["address", "bytes32"],
    [move, ethers.encodeBytes32String(secret)],
  );

const MATCH_MAKER_ADDRESS = process.env.MATCH_MAKER_ADDRESS as Address;
if (!MATCH_MAKER_ADDRESS) {
  throw new Error("Missing match maker address");
}

const CONTRACT_API_ADDRESS = process.env.CONTRACT_API_ADDRESS as Address;
if (!CONTRACT_API_ADDRESS) {
  throw new Error("Missing contract API");
}

const DEFAULT_SLEEP_TIME = 5_000;
const EMPTY_COMMIT =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const GAS_LIMIT = BigInt(5_000_000);
const MAX_INSTANCES = BigInt(process.env.MAX_INSTANCES || 10);
const MODE = BigInt(process.env.MODE || "2");
const OFFENSE_ONLY = process.env.OFFENSE_ONLY === "true";
const SHOULD_WAIT_IN_QUEUE = process.env.SHOULD_WAIT_IN_QUEUE === "true";

const PRIVATE_KEY = process.env.BOT_PRIVATE_KEY as `0x${string}`;
if (!PRIVATE_KEY) {
  throw new Error("Please set BOT_PRIVATE_KEY env");
}

const botAccount = privateKeyToAccount(PRIVATE_KEY);

const botClient = createWalletClient({
  account: botAccount,
  chain: polychainMonstersTestnet,
  transport: http(),
}).extend(publicActions);

const getRandomBigInt = (max: number) => {
  return BigInt(Math.floor(Math.random() * (max - 1))) + 1n;
};

const sleepAndRun = async (ms: number = DEFAULT_SLEEP_TIME) => {
  console.info(`Sleeping for ${ms}ms before running again...`);
  await sleep(ms);
  await run();
};

async function run() {
  console.info(
    `Bot running with mode ${MODE} and address ${botClient.account.address}.`,
  );

  const botFileName = path.resolve(__dirname, `${botAccount.address}.bot.json`);
  if (!fs.existsSync(botFileName)) {
    fs.writeFileSync(botFileName, Buffer.from(JSON.stringify({})));
  }

  const baseParamsMatchMaker = {
    account: botAccount,
    address: MATCH_MAKER_ADDRESS,
    abi: matchMakerAbi.abi,
    gas: GAS_LIMIT,
  };

  const baseParamsContractApi = {
    ...baseParamsMatchMaker,
    address: CONTRACT_API_ADDRESS,
    abi: contractApiAbi.abi,
  };

  console.info("Checking if bot is in match...");
  // first check if the bot is in a match itself
  const { request: matchRequest } = await botClient.simulateContract({
    ...baseParamsMatchMaker,
    functionName: "getMatchByUser",
    args: [botAccount.address],
  });

  const match = (await botClient.readContract(
    matchRequest,
  )) as MatchMakerV2.MatchViewStruct;
  if (match?.id === BigInt(0)) {
    console.info("No match found for bot, checking queue...");

    const { request: queueRequest } = await botClient.simulateContract({
      ...baseParamsMatchMaker,
      functionName: "queuedTeams",
      args: [MODE],
    });

    const queuedTeam = (await botClient.readContract(queueRequest)) as [
      Address,
    ];

    if (queuedTeam[0] === zeroAddress && !SHOULD_WAIT_IN_QUEUE) {
      console.info("No queued team found, skipping.");
      return sleepAndRun();
    }

    if (queuedTeam[0] === botAccount.address) {
      if (SHOULD_WAIT_IN_QUEUE) {
        console.info("Found self in queue, waiting...");
        return sleepAndRun();
      }

      console.info("Found self in queue, leaving...");
      const { request: withdrawRequest } = await botClient.simulateContract({
        ...baseParamsMatchMaker,
        functionName: "withdraw",
        args: [MODE],
      });
      await botClient.writeContract(withdrawRequest);
      return sleepAndRun();
    }

    if (queuedTeam[0] === zeroAddress) {
      console.info("No queued team found, joining...");
    } else {
      console.info(`Found queued team with owner ${queuedTeam[0]}, joining...`);
    }

    const { request: joinRequest } = await botClient.simulateContract({
      ...baseParamsMatchMaker,
      functionName: "createAndJoin",
      args: [MODE, getRandomBigInt(12), getRandomBigInt(12)],
    });

    await botClient.writeContract(joinRequest);

    if (queuedTeam[0] === zeroAddress) {
      console.info(`Joined queue, now waiting...`);
    } else {
      console.info(`Joined match with owner ${queuedTeam[0]}`);
    }
    return sleepAndRun();
  }

  if (match?._match.phase === 2) {
    console.info(`Match is game over, leaving...`);
    const { request: withdrawRequest } = await botClient.simulateContract({
      ...baseParamsMatchMaker,
      functionName: "withdrawFromMatch",
      args: [match.id],
    });
    await botClient.writeContract(withdrawRequest);
    return sleepAndRun();
  }

  if (match?._match.escaped !== zeroAddress) {
    console.info(`Opponent left, also leaving`);
    const { request: withdrawRequest } = await botClient.simulateContract({
      ...baseParamsMatchMaker,
      functionName: "withdrawFromMatch",
      args: [match.id],
    });
    await botClient.writeContract(withdrawRequest);
    return sleepAndRun();
  }

  const isChallenger =
    match?._match.challengerTeam.owner === botAccount.address;
  console.info(`Bot is ${isChallenger ? "challenger" : "opponent"}`);

  // set isMatchOld to true if the timeout expired 10 min ago
  const isMatchOld =
    (match?._match.timeout as bigint) > BigInt(0) &&
    (match?._match.timeout as bigint) <
      BigInt(Math.floor(Date.now() / 1000) - 600);

  if (isMatchOld) {
    console.info(`Match timeout expired 10 min ago, leaving...`);
    const { request: withdrawRequest } = await botClient.simulateContract({
      ...baseParamsMatchMaker,
      functionName: "withdrawFromMatch",
      args: [match.id],
    });
    await botClient.writeContract(withdrawRequest);
  }

  const moveToCheck = isChallenger
    ? match?._match.currentChallengerMove
    : match?._match.currentOpponentMove;

  if (moveToCheck?.commit === EMPTY_COMMIT) {
    console.info(`No commit found yet, preparing commit...`);

    const move = getRandomMove();
    console.info(`Selected random move: ${move}`);
    const { request: getContactRequest } = await botClient.simulateContract({
      ...baseParamsContractApi,
      functionName: "getContract",
      args: [BigInt(0), move],
    });
    const moveAddress = await botClient.readContract(getContactRequest);

    try {
      console.info(`Committing move ${move} with address ${moveAddress}`);
      const { request: commitRequest } = await botClient.simulateContract({
        ...baseParamsMatchMaker,
        functionName: "commit",
        args: [match.id, getCommitHash(moveAddress as string)],
      });

      await botClient.writeContract(commitRequest);

      // write move and round to file
      const fileContent = fs.readFileSync(botFileName);
      const parsedFileContent = JSON.parse(fileContent.toString());
      parsedFileContent.commit = moveAddress;
      parsedFileContent.round = parseInt(`${match._match.round}`);
      fs.writeFileSync(botFileName, JSON.stringify(parsedFileContent));

      return sleepAndRun(1_000);
    } catch (err: any) {
      if (err.message.includes("MatchMakerV2: game over")) {
        console.info(`Game over, next iteration will leave...`);
      } else {
        throw err;
      }

      return sleepAndRun();
    }
  }

  if (moveToCheck?.move === zeroAddress) {
    const fileContent = fs.readFileSync(botFileName);
    const parsedFileContent = JSON.parse(fileContent.toString());

    if (!parsedFileContent.commit) {
      console.info(`Lost commit history, leaving...`);
      try {
        const { request: withdrawRequest } = await botClient.simulateContract({
          ...baseParamsMatchMaker,
          functionName: "withdrawFromMatch",
          args: [match.id],
        });
        await botClient.writeContract(withdrawRequest);
      } catch (err: any) {
        if (err.includes("MatchMakerV2: not your match")) {
          // just ignore
        } else {
          throw err;
        }
      }

      return sleepAndRun();
    }

    console.info(`Revealing move ${parsedFileContent.commit}`);
    try {
      const { request: revealRequest } = await botClient.simulateContract({
        ...baseParamsMatchMaker,
        functionName: "reveal",
        args: [
          match.id,
          parsedFileContent.commit,
          ethers.encodeBytes32String("secret"),
        ],
      });

      await botClient.writeContract(revealRequest);

      delete parsedFileContent.commit;
      fs.writeFileSync(botFileName, JSON.stringify(parsedFileContent));
    } catch (err: any) {
      if (err.message.includes("MatchMakerV2: not in reveal phase")) {
        console.info(`Not in reveal phase yet, waiting...`);
      } else {
        throw err;
      }
    }

    return sleepAndRun();
  }

  return sleepAndRun();
}

run();
