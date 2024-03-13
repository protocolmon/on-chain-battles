import { privateKeyToAccount } from "viem/accounts";
import { Address, createWalletClient, http, publicActions } from "viem";
import { pmon } from "./chain";
import boosterPacksAbi from "../artifacts/contracts/packs/BoosterPacks.sol/BoosterPacks.json";

const GAS_LIMIT = BigInt(5_000_000);

const BOOSTER_PACKS_ADDRESS = process.env.BOOSTER_PACKS_ADDRESS as Address;
if (!BOOSTER_PACKS_ADDRESS) {
  throw new Error("Missing booster packs address");
}

const REVEAL_PRIVATE_KEY = process.env.BOT_REVEAL_PRIVATE_KEY as `0x${string}`;
if (!REVEAL_PRIVATE_KEY) {
  throw new Error("Please set BOT_REVEAL_PRIVATE_KEY env");
}

const botAccount = privateKeyToAccount(REVEAL_PRIVATE_KEY);

const botClient = createWalletClient({
  account: botAccount,
  chain: pmon,
  transport: http(),
}).extend(publicActions);

async function run() {
  console.info(`Reveal bot running with address ${botClient.account.address}.`);

  const baseParamsBoosterPacks = {
    account: botAccount,
    address: BOOSTER_PACKS_ADDRESS,
    abi: boosterPacksAbi.abi,
    gas: GAS_LIMIT,
  };

  try {
    await botClient.writeContract({
      ...baseParamsBoosterPacks,
      functionName: "fulfillRevealEpoch",
      args: [],
    });
  } catch (err) {
    console.log(err);
  }

  // sleep for 10 seconds then run again
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  return run();
}

run();
