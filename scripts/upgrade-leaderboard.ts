import { ethers, upgrades } from "hardhat";
import contracts from "../cli/contracts.generated.json";

async function main() {
  const LeaderboardV1 = await ethers.getContractFactory("LeaderboardV1");
  const leaderboardV1 = await upgrades.upgradeProxy(
    "0x2412a52A7D79AE0416397bB672138C089a9B8e02",
    LeaderboardV1,
  );
  console.log("LeaderboardV1 upgraded to:", await leaderboardV1.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
