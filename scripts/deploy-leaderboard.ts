import { ethers } from "hardhat";
import { deployContract, deployProxy } from "./utils";
import { LeaderboardManagerV2, UsernamesV1 } from "../typechain-types";
import {
  SECONDS_IN_A_DAY,
  randomEthAddresses,
  usernamesList,
} from "./constants";

async function main() {
  // Get deployer
  const [deployer] = await ethers.getSigners();

  // Set owner/match maker and event name
  const deployerAddress = await deployer.getAddress();
  const eventName = "eventName";

  // Set leaderboard's valid time period
  const thirtyDaysInSeconds = 30 * SECONDS_IN_A_DAY;
  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  const latestBlockNumber = await ethers.provider.getBlockNumber();
  const latestBlock = await ethers.provider.getBlock(latestBlockNumber);
  const validUntil =
    (latestBlock ? latestBlock.timestamp : currentTimeInSeconds) +
    thirtyDaysInSeconds;

  // Deploy UsernamesV1
  const { address: usernamesAddress, instance: usernames } =
    await deployContract("UsernamesV1", [deployerAddress]);

  // Register users from usernamesList along with their ETH addresses from randomEthAddresses to newly deployed UsernamesV1 instance
  for (let i = 0; i < usernamesList.length; i++) {
    await (usernames as unknown as UsernamesV1).registerNameAsOwner(
      usernamesList[i],
      randomEthAddresses[i],
    );
  }

  // Deploy LeaderboardManagerV2
  const { instance: manager } = await deployProxy("LeaderboardManagerV2", [
    deployerAddress,
  ]);

  // Deploy LeaderboardV2
  const { address: leaderboardAddress, instance: leaderboard } =
    await deployProxy("LeaderboardV2", [
      deployerAddress,
      usernamesAddress,
      validUntil,
      eventName,
    ]);

  await (manager as unknown as LeaderboardManagerV2).setActiveLeaderboard(
    leaderboardAddress,
  );

  // Randomly assign wins, escapes, and losses
  for (let i = 0; i < 100; i++) {
    const action = Math.floor(Math.random() * 3); // Random number between 0 and 2
    const playerIndex = Math.floor(Math.random() * randomEthAddresses.length);
    const playerAddress = randomEthAddresses[playerIndex];

    switch (action) {
      case 0: // Add escape
        await leaderboard.addEscape(playerAddress);
        break;
      case 1: // Add win
        await leaderboard.addWin(playerAddress);
        break;
      case 2: // Add loss
        await leaderboard.addLoss(playerAddress);
        break;
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
