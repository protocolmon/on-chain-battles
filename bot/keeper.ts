import { Address, createWalletClient, http, publicActions } from "viem";
import { getChain } from "./chain";
import { privateKeyToAccount } from "viem/accounts";
import matchMakerAbi from "../artifacts/contracts/MatchMakerV3.sol/MatchMakerV3.json";

const GAS_LIMIT = BigInt(500_000);

const chain = getChain();

const MATCH_MAKER_ADDRESS = process.env.MATCH_MAKER_ADDRESS as Address;
if (!MATCH_MAKER_ADDRESS) {
  throw new Error("Missing match maker address");
}

const KEEPER_PRIVATE_KEY = process.env.BOT_KEEPER_PRIVATE_KEY as `0x${string}`;
if (!KEEPER_PRIVATE_KEY) {
  throw new Error("Please set BOT_KEEPER_PRIVATE_KEY env");
}

const botAccount = privateKeyToAccount(KEEPER_PRIVATE_KEY);

const botClient = createWalletClient({
  account: botAccount,
  chain,
  transport: http(),
}).extend(publicActions);

async function run() {
  console.info(`Keeper bot running with address ${botClient.account.address}.`);

  // get the latest block
  const currentBlock = await botClient.getBlock({ blockTag: "latest" });
  const currentBlockTimestamp = BigInt(currentBlock.timestamp);
  const currentTime = BigInt(Math.floor(Date.now() / 1000));

  if (currentTime - currentBlockTimestamp > 5) {
    const baseParamsMatchMaker = {
      account: botAccount,
      address: MATCH_MAKER_ADDRESS,
      abi: matchMakerAbi.abi,
      gas: GAS_LIMIT,
    };

    try {
      await botClient.writeContract({
        ...baseParamsMatchMaker,
        functionName: "updateBlockTimestamp",
        args: [],
      });
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log(
      "Current block is less than 5 seconds old, skipping contract call.",
    );
  }

  // sleep for 4 seconds then run again
  await new Promise((resolve) => setTimeout(resolve, 4_000));
  return run();
}

run();
