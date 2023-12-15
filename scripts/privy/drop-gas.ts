import { PrivyClient } from "@privy-io/server-auth";
import { ethers } from "hardhat";

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_SECRET!,
);

async function run() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log(`Deployer address is ${deployerAddress}`);

  const users = await privy.getUsers();

  for (const user of users) {
    if (user.wallet) {
      try {
        // Fetch the balance of the user's wallet
        const userBalance = await ethers.provider.getBalance(
          user.wallet.address,
        );
        const desiredBalance = ethers.parseEther("0.02");

        // Check if balance is less than 0.02 ETH
        if (userBalance < desiredBalance) {
          const amountToSend = desiredBalance - userBalance;

          const tx = {
            to: user.wallet.address,
            value: amountToSend,
          };

          // Send the transaction
          const transaction = await deployer.sendTransaction(tx);
          await transaction.wait(); // Wait for the transaction to be mined
          console.log(
            `Sent ${ethers.formatEther(amountToSend)} ETH to ${
              user.wallet.address
            }`,
          );
        } else {
          console.log(`${user.wallet.address} already has 0.02 ETH or more.`);
        }
      } catch (error) {
        console.error(`Failed to process for ${user.wallet.address}: ${error}`);
      }
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
