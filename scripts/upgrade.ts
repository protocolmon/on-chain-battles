import { ethers, upgrades } from "hardhat";

async function main() {
  const MatchMaker = await ethers.getContractFactory("MatchMakerV3");
  const matchMaker = await upgrades.upgradeProxy(
    process.env.MATCH_MAKER_ADDRESS as string,
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
