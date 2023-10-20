import { ethers } from "hardhat";
import contracts from "../contracts.generated.json";

export async function getContractInstance<T>(contractName: string): Promise<T> {
  const contractFactory = await ethers.getContractFactory(contractName);
  return contractFactory.attach(
    // @ts-ignore
    contracts.contracts[contractName],
  ) as unknown as T;
}
