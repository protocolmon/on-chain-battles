import { ethers, upgrades } from "hardhat";
import contracts from "../cli/contracts.generated.json";

async function main() {
  const MatchMakerV2 = await ethers.getContractFactory("MatchMakerV2");
  const matchMakerV2 = await upgrades.upgradeProxy(
    contracts.contracts.MatchMakerV2,
    MatchMakerV2,
  );
  console.log("MatchMakerV2 upgraded to:", matchMakerV2.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
