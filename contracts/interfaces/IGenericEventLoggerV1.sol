// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

interface IGenericEventLoggerV1 {
    struct Log {
        string name;
        string[] data;
        uint256 timestamp;
    }

    struct DisplayLog {
        Log log;
        uint256 tokenId;
        uint256 matchId;
    }

    event MatchLogEvent(uint256 matchId, string name, string[] data, uint256 timestamp);
    event TokenLogEvent(uint256 tokenId, string name, string[] data, uint256 timestamp);

    function logEventByTokenId(uint256 tokenId, string memory name, string[] memory data) external;

    function logEventByMatchId(uint256 matchId, string memory name, string[] memory data) external;

    function logEventByMatchId(uint256 matchId, string memory name, uint256 data) external;
}
