import axios from "axios";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";
import { getFirestore } from "firebase-admin/firestore";
import {
  Address,
  createPublicClient,
  getContract,
  http,
  zeroAddress,
} from "viem";
import { pmonChain } from "../pmonChain";

const matchMakerContractAddress = defineString("MATCH_MAKER_CONTRACT_ADDRESS");
const discordWebhookUrl = defineString("DISCORD_WEBHOOK_URL");
const usernamesContractAddress = defineString("USERNAMES_CONTRACT_ADDRESS");

const shortenAddress = (address: Address) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const discordMatchQueue = onSchedule("every 1 minutes", async () => {
  logger.info(`Listening on contract ${matchMakerContractAddress.value()}`);

  const client = createPublicClient({
    chain: pmonChain,
    transport: http(),
  });

  const matchMakerContract = getContract({
    address: matchMakerContractAddress.value() as Address,
    abi: [
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "queuedTeams",
        outputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "firstMonsterId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "secondMonsterId",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    publicClient: client,
  });

  const usernamesContract = getContract({
    address: usernamesContractAddress.value() as Address,
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        name: "addressToName",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    publicClient: client,
  });

  const queuedTeam = await matchMakerContract.read.queuedTeams([BigInt(1)]);
  const owner = queuedTeam[0];
  logger.info(`Queued team: ${JSON.stringify(queuedTeam)}`);

  const db = getFirestore();

  const existingEntry = await db.collection("match-queue").doc("team").get();
  if (existingEntry.get("owner") == owner) {
    // no additional notification needed
    return;
  }

  await db.collection("match-queue").doc("team").set({
    owner: queuedTeam[0],
  });

  logger.info(`Stored owner ${queuedTeam[0]}`);
  if (queuedTeam[0] == zeroAddress) {
    return;
  }

  let usernameOrAddress = shortenAddress(queuedTeam[0]);
  try {
    const username = await usernamesContract.read.addressToName([
      queuedTeam[0],
    ]);
    if (username) {
      usernameOrAddress = username;
    }

    await axios.post(discordWebhookUrl.value(), {
      content: `${usernameOrAddress} is ready to battle!`,
    });
    logger.info("Message sent to Discord webhook");
  } catch (error) {
    logger.error("Error sending message to Discord webhook:", error);
  }
});
