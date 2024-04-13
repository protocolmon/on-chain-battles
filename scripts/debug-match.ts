import { ethers, upgrades } from "hardhat";
import { MatchMakerV3 } from "../typechain-types";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function main() {
  const MatchMaker = await ethers.getContractFactory("MatchMakerV3");
  const matchMaker = await MatchMaker.attach(
    "0x72080c9212a58A69a47b9ED2a977dEA8f0A7d855",
  );
  const match = await (matchMaker as unknown as MatchMakerV3).getMatchById(141);
  console.log(JSON.stringify(match));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
