import { decodeAbiParameters, parseAbiParameters } from "viem";
import { EventLog, eventLogClasses } from "./types";
import { EventLoggerV1 } from "../../typechain-types";

const decodeEventData = (data: any, iface: string) => {
  // @ts-ignore Not sure what's wrong with viem types
  return decodeAbiParameters(parseAbiParameters(iface), data);
};

export const decodeEvent = (
  id: bigint,
  name: bigint,
  timestamp: bigint,
  data: any[],
) => {
  let decodedEvent: typeof eventLogClasses | undefined;

  for (const eventLogClass of eventLogClasses) {
    if (eventLogClass.ON_CHAIN_NAME === name) {
      decodedEvent = new eventLogClass(
        id,
        eventLogClass.name,
        timestamp,
        decodeEventData(data, eventLogClass.INTERFACE),
      );
      break;
    }
  }

  return decodedEvent;
};
