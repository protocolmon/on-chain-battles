import { ethers, upgrades } from "hardhat";
import contracts from "../cli/contracts.generated.json";
import { MatchMakerV2 } from "../typechain-types";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function main() {
  const MatchMaker = await ethers.getContractFactory("MatchMakerV2");
  const matchMaker = await MatchMaker.attach(contracts.contracts.MatchMakerV2);
  const match = await (matchMaker as unknown as MatchMakerV2).getMatchById(
    process.env.MATCH_ID as string,
  );
  console.log(JSON.stringify(match));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
