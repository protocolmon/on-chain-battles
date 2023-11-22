import { getContractInstance } from "./utils/contracts";
import { MonsterApiV1, MatchMakerV2, EventLoggerV1 } from "../typechain-types";
import { decodeEvent } from "../src";

const monsterName = (monsterId: bigint) => {
  switch (monsterId) {
    case BigInt(1):
      return "Blazehorn";
    case BigInt(2):
      return "Foretusk";
    case BigInt(3):
      return "Aquasteer";
    case BigInt(4):
      return "Flampanda";
    case BigInt(5):
      return "Verdubear";
    case BigInt(6):
      return "Wavepaw";
    case BigInt(7):
      return "Pyrilla";
    case BigInt(8):
      return "Florangutan";
    case BigInt(9):
      return "Tidalmonk";
    case BigInt(10):
      return "Fernopig";
    case BigInt(11):
      return "Leafsnout";
    case BigInt(12):
      return "Streamhog";
    default:
      return "";
  }
};

async function debug() {
  const matchId = process.env.MATCH_ID;
  if (!matchId) {
    throw new Error("Missing matchId");
  }

  const matchMakerV2 = await getContractInstance<MatchMakerV2>("MatchMakerV2");
  const eventLoggerV1 =
    await getContractInstance<EventLoggerV1>("EventLoggerV1");
  const monsterApiV1 = await getContractInstance<MonsterApiV1>("MonsterApiV1");

  let offset = 0;
  let finished = false;
  let allLogs: any[] = [];

  do {
    const logs = await eventLoggerV1.getLogs(matchId, offset);
    allLogs = allLogs.concat(logs);
    if (logs.length < 100) {
      finished = true;
    }
  } while (!finished);

  for (const log of allLogs) {
    const decoded = await decodeEvent(
      log.id,
      log.action,
      log.timestamp,
      log.data,
    );
    if (decoded.monsterId) {
      const monster = await monsterApiV1.getMonster(decoded.monsterId);
      decoded.monsterName = monsterName(monster.monsterType);
    }

    console.log(decoded);
  }
}

debug()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
