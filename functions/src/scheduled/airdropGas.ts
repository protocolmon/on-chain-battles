import { logger } from "firebase-functions";
import { PrivyClient } from "@privy-io/server-auth";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";
import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { pmonChain } from "../pmonChain";

// this is for testnet purposes only
const pk = defineString("GAS_AIRDROPPER_PK");
const privyAppId = defineString("PRIVY_APP_ID");
const privySecret = defineString("PRIVY_SECRET");

const privy = new PrivyClient(privyAppId.value(), privySecret.value());

export const airdropGas = onSchedule("every 1 minutes", async () => {
  const walletClient = createWalletClient({
    chain: pmonChain,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: pmonChain,
    transport: http(),
  });

  const account = privateKeyToAccount(pk.value() as `0x${string}`);

  const users = await privy.getUsers();
  for (const user of users) {
    if (user.wallet) {
      try {
        // Fetch the balance of the user's wallet
        const userBalance = await publicClient.getBalance({
          address: user.wallet.address as Address,
        });

        const desiredBalance = parseEther("0.03");
        const ninetyPercentOfDesiredBalance =
          (desiredBalance * BigInt(90)) / BigInt(100);

        // Check if balance is less than 0.03 ETH
        if (userBalance < ninetyPercentOfDesiredBalance) {
          const amountToSend = desiredBalance - userBalance;

          const tx = {
            account,
            to: user.wallet.address as Address,
            value: amountToSend,
          };

          // Send the transaction
          const hash = await walletClient.sendTransaction(tx);
          logger.info(
            `Sent ${formatEther(amountToSend)} ETH to ${
              user.wallet.address
            } with hash ${hash}`,
          );
        } else {
          logger.info(`${user.wallet.address} already has 0.03 ETH or more.`);
        }
      } catch (error) {
        logger.error(`Failed to process for ${user.wallet.address}: ${error}`);
      }
    }
  }
});
