import { ethers } from "hardhat";
import contracts from "../cli/contracts.generated.json";
import { deployContract } from "./utils";
import {
  ContractApiV1,
  EventLoggerV1,
  MatchMakerV2,
  TimeoutMove,
} from "../typechain-types";

const CONTRACT_API_V1_ADDRESS = process.env.CONTRACT_API_V1_ADDRESS as string;
const EVENT_LOGGER_V1_ADDRESS = process.env.EVENT_LOGGER_V1_ADDRESS as string;
const MOVE_EXECUTOR_V1_ADDRESS = process.env.MOVE_EXECUTOR_V1_ADDRESS as string;
const MATCH_MAKER_V2_ADDRESS = process.env.MATCH_MAKER_V2_ADDRESS as string;

async function main() {
  const ContractApiV1 = await ethers.getContractFactory("ContractApiV1");
  const contractApiV1: ContractApiV1 = (await ContractApiV1.attach(
    CONTRACT_API_V1_ADDRESS,
  )) as ContractApiV1;

  const { address: timeoutMoveAddress, instance: timeoutMoveInstance } =
    await deployContract("TimeoutMove");

  const Logger = await ethers.getContractFactory("EventLoggerV1");
  const logger: EventLoggerV1 = (await Logger.attach(
    EVENT_LOGGER_V1_ADDRESS,
  )) as EventLoggerV1;

  const timeoutMove = timeoutMoveInstance as TimeoutMove;

  await timeoutMove.setLogger(EVENT_LOGGER_V1_ADDRESS);
  await timeoutMove.addExecutor(MOVE_EXECUTOR_V1_ADDRESS);
  await logger.addWriter(timeoutMoveAddress);
  await contractApiV1.setContract("0", "TimeoutMove", timeoutMoveAddress);

  const MatchMakerV2 = await ethers.getContractFactory("MatchMakerV2");
  const matchMakerV2 = (await MatchMakerV2.attach(
    MATCH_MAKER_V2_ADDRESS,
  )) as MatchMakerV2;

  await matchMakerV2.setTimeout(1, 47, timeoutMoveAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
