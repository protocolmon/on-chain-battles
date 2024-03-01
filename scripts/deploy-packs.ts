import { ethers, network } from "hardhat";
import { formatEther, parseEther, zeroAddress } from "viem";
import prompts from "prompts";
import { deployProxy } from "./utils";

const MAX_TOTAL_SUPPLY = 100_000;

const FACTOR_IN_SATS = parseEther("100") / BigInt(MAX_TOTAL_SUPPLY);
const FACTOR_IN_SATS_SCALED = FACTOR_IN_SATS * BigInt(10 ** 18);

const config = {
  bondingCurveParams: {
    // price increases by 100 pmon / 100_000 supply
    factor: FACTOR_IN_SATS_SCALED,
    // linear curve
    exponent: 1n,
    // start price = 0.1 PMON
    c: parseEther("0.1") * BigInt(10 ** 18),
    maxSupply: BigInt(MAX_TOTAL_SUPPLY),
  },
};

async function main() {
  const [owner] = await ethers.getSigners();

  const balance = await ethers.provider.getBalance(owner.address);

  const response = await prompts({
    type: "confirm",
    name: "value",
    message: `Deploying with owner ${
      owner.address
    } with a balance of ${formatEther(balance)} ETH`,
    initial: true,
  });

  if (!response.value) {
    throw new Error("Transaction aborted");
  }

  const TokenUriProvider = await ethers.getContractFactory(
    "ElementalEchoesTokenUriProvider",
  );
  const tokenUriProvider = await TokenUriProvider.deploy(
    "https://drive.polychainmonsters.com/ipfs/QmUMZiwsJyNDkK67WjXi7zKixxUjFLXezq11mSK7e5wDPT/",
    network.name === "blast-testnet"
      ? "QmaLhZrkbPBEux4f6XSmaktwgA3TCxnQzQhwn1ayNEa8qq"
      : "QmYqnHSys9m8dPDWpjPWqnP95FBZCxdpxii3VvzaLqCpss",
  );

  console.log(
    "TokenUriProvider deployed to:",
    await tokenUriProvider.getAddress(),
  );

  await deployProxy("BoosterPacks", [
    "BoosterPacks",
    "PACK",
    zeroAddress, // @todo: replace with actual blast contract
    owner.address,
    await tokenUriProvider.getAddress(),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
