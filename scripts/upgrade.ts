import { ethers, upgrades } from "hardhat";
import contracts from "../cli/contracts.generated.json";

async function main() {
  const MatchMakerV2 = await ethers.getContractFactory("MatchMakerV2");
  const matchMakerV2 = await upgrades.upgradeProxy(
    "0x5D000Aa06746aC118351AAc034e1505dF6820D56",
    MatchMakerV2,
  );
  console.log("MatchMakerV2 upgraded to:", await matchMakerV2.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
