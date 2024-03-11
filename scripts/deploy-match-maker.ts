import { ethers } from "hardhat";
import { deployContract, deployProxy } from "./utils";
import { EventLoggerV1, MatchMakerV3 } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();

  const { address: matchMakerV3Address, instance: matchMakerV3 } =
    await deployProxy("MatchMakerV3Confidential", [
      "0xB173bdaC9c508A804de8F491dd8cE2C725795eCa",
      "0xeFDAfF67256Dce31BF76cECb2FeDDc1653DCc19f",
      "0xFd8519381B6769Ed5F1b967D77Aef7b925d9F374",
    ]);

  console.log(`Setting leaderboard on match maker...`);
  await (matchMakerV3 as unknown as MatchMakerV3).setLeaderboard(
    "0xa3E493cc87c4B21AFBe157C6e1251720aB756d18",
  );

  console.log(`Permitting match maker to use move executor`);
  const moveExecutorV1 = await ethers.getContractAt(
    "MoveExecutorV1",
    "0xeFDAfF67256Dce31BF76cECb2FeDDc1653DCc19f",
  );
  await moveExecutorV1.grantRole(
    await moveExecutorV1.PERMITTED_ROLE(),
    matchMakerV3Address,
  );

  const eventLoggerV1 = await ethers.getContractAt(
    "EventLoggerV1",
    "0xFd8519381B6769Ed5F1b967D77Aef7b925d9F374",
  );

  await (eventLoggerV1 as EventLoggerV1).addWriter(matchMakerV3Address);
  await (eventLoggerV1 as EventLoggerV1).addWriter(
    await moveExecutorV1.getAddress(),
  );

  await matchMakerV3.setMode(
    1,
    60 * 60,
    "0xfB21Fdc26EB793d4cccD01D2be51d6F158b7a4B8",
  );

  const leaderboard = await ethers.getContractAt(
    "LeaderboardV1",
    "0xa3E493cc87c4B21AFBe157C6e1251720aB756d18",
  );
  await leaderboard.setMatchMaker(matchMakerV3Address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
