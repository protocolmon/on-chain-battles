import { ethers, upgrades } from "hardhat";
import contracts from "../tmp/contracts.generated.json";
import { MatchMakerV2 } from "../typechain-types";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function main() {
  const MatchMaker = await ethers.getContractFactory(
    "MatchMakerV3Confidential",
  );
  const matchMaker = await MatchMaker.attach(
    "0x7D566233EeD4C8c715D00aA8af27Cf9e15f1CD11",
  );
  await matchMaker.setMode(
    1,
    60 * 60,
    "0xfB21Fdc26EB793d4cccD01D2be51d6F158b7a4B8",
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
