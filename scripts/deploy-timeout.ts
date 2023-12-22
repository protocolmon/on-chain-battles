import { ethers } from "hardhat";
import contracts from "../cli/contracts.generated.json";
import { deployContract } from "./utils";
import { ContractApiV1, EventLoggerV1, TimeoutMove } from "../typechain-types";

async function main() {
  const ContractApiV1 = await ethers.getContractFactory("ContractApiV1");
  const contractApiV1: ContractApiV1 = (await ContractApiV1.attach(
    contracts.contracts.ContractApiV1,
  )) as ContractApiV1;

  const { address: timeoutMoveAddress, instance: timeoutMoveInstance } =
    await deployContract("TimeoutMove");

  const Logger = await ethers.getContractFactory("EventLoggerV1");
  const logger: EventLoggerV1 = (await Logger.attach(
    contracts.contracts.EventLoggerV1,
  )) as EventLoggerV1;

  const timeoutMove = timeoutMoveInstance as TimeoutMove;

  await timeoutMove.setLogger(contracts.contracts.EventLoggerV1);
  await timeoutMove.addExecutor(contracts.contracts.MoveExecutorV1);
  await logger.addWriter(timeoutMoveAddress);
  await contractApiV1.setContract("0", "TimeoutMove", timeoutMoveAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
