import { ethers } from "hardhat";
import { deployContract, deployProxy } from "./utils";
import { EventLoggerV1, MatchMakerV3 } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();

  const { address: matchMakerV3Address, instance: matchMakerV3 } =
    await deployProxy("MatchMakerV3", [
      "0x22635143FC6B55e8CF1a19FA0AbEc1E3C27E3eb5",
      "0x393bF034F14E6d9ABF811BE4965B48C40b07658E",
      "0x03E775Daae2E17ef0765d7938956bE47A1d76ca1",
    ]);

  console.log(`Setting leaderboard on match maker...`);
  await (matchMakerV3 as unknown as MatchMakerV3).setLeaderboard(
    "0x56823D64d656A36e675bE64BfbCbA7aAf7b959c3",
  );

  console.log(`Permitting match maker to use move executor`);
  const moveExecutorV1 = await ethers.getContractAt(
    "MoveExecutorV1",
    "0x393bF034F14E6d9ABF811BE4965B48C40b07658E",
  );
  await moveExecutorV1.grantRole(
    await moveExecutorV1.PERMITTED_ROLE(),
    matchMakerV3Address,
  );

  const eventLoggerV1 = await ethers.getContractAt(
    "EventLoggerV1",
    "0x03E775Daae2E17ef0765d7938956bE47A1d76ca1",
  );

  await (eventLoggerV1 as EventLoggerV1).addWriter(matchMakerV3Address);
  await (eventLoggerV1 as EventLoggerV1).addWriter(
    await moveExecutorV1.getAddress(),
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
