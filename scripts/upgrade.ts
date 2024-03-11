import { ethers, upgrades } from "hardhat";

async function main() {
  const MatchMaker = await ethers.getContractFactory(
    "MatchMakerV3Confidential",
  );
  const matchMaker = await upgrades.upgradeProxy(
    "0x7D566233EeD4C8c715D00aA8af27Cf9e15f1CD11" as string,
    MatchMaker,
  );
  console.log("MatchMaker upgraded to:", await matchMaker.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
