import { ethers } from "hardhat";
import { formatEther } from "viem";
import prompts from "prompts";
import { deployProxy } from "./utils";

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
    "https://drive.polychainmonsters.com/ipfs/QmYqnHSys9m8dPDWpjPWqnP95FBZCxdpxii3VvzaLqCpss",
  );

  console.log(
    "TokenUriProvider deployed to:",
    await tokenUriProvider.getAddress(),
  );

  await deployProxy("BoosterPacks", [
    "BoosterPacks",
    "PACK",
    "0x275C1D7a6AD547209f5E29B8f89D370A9E8079eC", // fee receiver
    await tokenUriProvider.getAddress(),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
