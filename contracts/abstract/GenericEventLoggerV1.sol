// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IGenericEventLoggerV1.sol";

contract GenericEventLoggerV1 is IGenericEventLoggerV1 {
    using Strings for uint256;

    // Pagination constants
    uint256 constant MAX_EVENTS = 100;

    mapping(uint256 => Log[]) public logsByTokenId;
    mapping(uint256 => Log[]) public logsByMatchId;

    function logEventByTokenId(
        uint256 tokenId,
        string memory name,
        string[] memory data
    ) public {
        emit TokenLogEvent(tokenId, name, data, block.timestamp);
        logsByTokenId[tokenId].push(Log(name, data, block.timestamp));
    }

    function logEventByMatchId(
        uint256 matchId,
        string memory name,
        uint256 data
    ) public {
        string[] memory dataArr = new string[](1);
        dataArr[0] = data.toString();
        logEventByMatchId(matchId, name, dataArr);
    }

    function logEventByMatchId(
        uint256 matchId,
        string memory name,
        string[] memory data
    ) public {
        emit MatchLogEvent(matchId, name, data, block.timestamp);
        logsByMatchId[matchId].push(Log(name, data, block.timestamp));
    }

    function getEventLogs(
        uint256 matchId,
        uint256[] memory tokenIds,
        uint8 offset
    ) external view returns (string memory) {
        // Get all event logs for the match ID and token IDs
        DisplayLog[] memory logs = new DisplayLog[](MAX_EVENTS);

        uint256 logsIndex = 0;

        for (
            uint256 i = offset;
            i < logsByMatchId[matchId].length && logsIndex < MAX_EVENTS;
            i++
        ) {
            logs[logsIndex].log = logsByMatchId[matchId][i];
            logs[logsIndex].matchId = matchId;
            logsIndex++;
        }

        for (
            uint256 t = 0;
            t < tokenIds.length && logsIndex < MAX_EVENTS;
            t++
        ) {
            for (
                uint256 i = offset;
                i < logsByTokenId[tokenIds[t]].length && logsIndex < MAX_EVENTS;
                i++
            ) {
                logs[logsIndex].log = logsByTokenId[tokenIds[t]][i];
                logs[logsIndex].tokenId = tokenIds[t];
                logsIndex++;
            }
        }

        // Convert the logs to a JSON string
        return logsToJSON(logs, logsIndex);
    }

    function logsToJSON(
        DisplayLog[] memory logs,
        uint256 logsLength
    ) internal pure returns (string memory) {
        string memory json = "[";

        for (uint256 i = 0; i < logsLength; i++) {
            if (i != 0) {
                json = string(abi.encodePacked(json, ","));
            }
            json = string(
                abi.encodePacked(
                    json,
                    "{",
                    '"name":"',
                    logs[i].log.name,
                    '","data":['
                )
            );

            for (uint256 j = 0; j < logs[i].log.data.length; j++) {
                if (j != 0) {
                    json = string(abi.encodePacked(json, ","));
                }
                json = string(
                    abi.encodePacked(json, '"', logs[i].log.data[j], '"')
                );
            }

            if (logs[i].tokenId != 0) {
                json = string(
                    abi.encodePacked(
                        json,
                        '],"tokenId":',
                        logs[i].tokenId.toString()
                    )
                );
            } else {
                json = string(
                    abi.encodePacked(
                        json,
                        '],"matchId":',
                        logs[i].matchId.toString()
                    )
                );
            }

            json = string(
                abi.encodePacked(
                    json,
                    ',"timestamp":',
                    logs[i].log.timestamp.toString(),
                    "}"
                )
            );
        }

        json = string(abi.encodePacked(json, "]"));

        return json;
    }
}
