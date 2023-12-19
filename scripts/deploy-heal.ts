import { ethers } from "hardhat";
import contracts from "../cli/contracts.generated.json";
import { deployContract } from "./utils";
import { ContractApiV1, EventLoggerV1, HealMove } from "../typechain-types";

async function main() {
  const ContractApiV1 = await ethers.getContractFactory("ContractApiV1");
  const contractApiV1: ContractApiV1 = (await ContractApiV1.attach(
    contracts.contracts.ContractApiV1,
  )) as ContractApiV1;

  const { address: healMoveAddress, instance: healMoveInstance } =
    await deployContract("HealMove");

  const Logger = await ethers.getContractFactory("EventLoggerV1");
  const logger: EventLoggerV1 = (await Logger.attach(
    contracts.contracts.EventLoggerV1,
  )) as EventLoggerV1;

  const healMove = healMoveInstance as HealMove;

  await healMove.setLogger(contracts.contracts.EventLoggerV1);
  await healMove.addExecutor(contracts.contracts.MoveExecutorV1);
  await logger.addWriter(healMoveAddress);
  await contractApiV1.setContract("0", "HealMove", healMoveAddress);

  console.log(`HealMove deployed to:`, healMoveAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
