import { ethers } from "hardhat";
import { deployProxy } from "./utils";
import contracts from "../cli/contracts.generated.json";

async function main() {
  const [deployer] = await ethers.getSigners();

  const { address: pmonAddress } = await deployProxy("LeaderboardV1", [
    await deployer.getAddress(),
    contracts.contracts.UsernamesV1,
  ]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
