// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IGenericEventLoggerV1.sol";
import "hardhat/console.sol";

contract GenericEventLoggerV1 is IGenericEventLoggerV1 {
    using Strings for uint256;

    // Pagination constants
    uint256 constant MAX_EVENTS = 100;

    mapping(uint256 => Log[]) public logsByTokenId;

    mapping(uint256 => Log[]) public logsByMatchId;

    function logEventByTokenId(uint256 tokenId, string memory name, string[] memory data) public {
        emit TokenLogEvent(tokenId, name, data, block.timestamp);

        logsByTokenId[tokenId].push(Log(name, data, block.timestamp));
    }

    function logEventByMatchId(uint256 matchId, string memory name, uint256 data) public {
        string[] memory dataArr = new string[](1);
        dataArr[0] = data.toString();
        logEventByMatchId(matchId, name, dataArr);
    }

    function logEventByMatchId(uint256 matchId, string memory name, string[] memory data) public {
        emit MatchLogEvent(matchId, name, data, block.timestamp);

        logsByMatchId[matchId].push(Log(name, data, block.timestamp));
    }

    function getEventLogs(uint256 matchId, uint256[] memory tokenIds, uint8 offset) external view returns (string memory) {
        // Get all event logs for the match ID and token IDs
        Log[] memory logs = new Log[](MAX_EVENTS);

        uint256 logsLength = 0;
        uint256 logsIndex = 0;

        for (uint256 i = offset; i < logsByMatchId[matchId].length; i++) {
            if (logsLength == MAX_EVENTS) break;
            logs[logsIndex] = logsByMatchId[matchId][i];
            logsLength++;
            logsIndex++;
        }

        for (uint256 t = 0; t < tokenIds.length; t++) {
            for (uint256 i = offset; i < logsByTokenId[tokenIds[t]].length; i++) {
                if (logsLength == MAX_EVENTS) break;
                logs[logsIndex] = logsByTokenId[tokenIds[t]][i];
                logsLength++;
                logsIndex++;
            }
        }

        // Convert the logs to a JSON string
        return logsToJSON(logs, logsLength);
    }

    function logsToJSON(Log[] memory logs, uint256 logsLength) internal pure returns (string memory) {
        // Placeholder for the JSON-like structure
        string memory json = "[";

        for (uint256 i = 0; i < logsLength; i++) {
            if (i != 0) {
                json = string(abi.encodePacked(json, ","));
            }
            json = string(abi.encodePacked(json, "{", "\"name\":\"", logs[i].name, "\",\"data\":["));
            for (uint256 j = 0; j < logs[i].data.length; j++) {
                if (j != 0) {
                    json = string(abi.encodePacked(json, ","));
                }
                json = string(abi.encodePacked(json, "\"", logs[i].data[j], "\""));
            }
            json = string(abi.encodePacked(json, "],\"timestamp\":", logs[i].timestamp.toString(), "}"));
        }

        json = string(abi.encodePacked(json, "]"));

        // console.log("json %s", json);

        return json;
    }
}
