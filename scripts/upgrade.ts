import { ethers, upgrades } from "hardhat";

async function main() {
  const MatchMaker = await ethers.getContractFactory("MatchMakerV3");
  const matchMaker = await upgrades.upgradeProxy(
    "0x72080c9212a58A69a47b9ED2a977dEA8f0A7d855" as string,
    MatchMaker,
  );
  console.log("MatchMaker upgraded to:", await matchMaker.getAddress());

  // Retrieve and log the new implementation address
  const matchMakerImplementationAddress =
    await upgrades.erc1967.getImplementationAddress(
      await matchMaker.getAddress(),
    );
  console.log(
    "New implementation address for MatchMaker is:",
    matchMakerImplementationAddress,
  );

  // const BoosterPacks = await ethers.getContractFactory("BoosterPacks");
  // const boosterPacks = await upgrades.upgradeProxy(
  //   "0x96a76C663bF7eB51250d823fe610b6d50aCA2097" as string,
  //   BoosterPacks,
  // );
  // console.log("BoosterPacks upgraded to:", await boosterPacks.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
