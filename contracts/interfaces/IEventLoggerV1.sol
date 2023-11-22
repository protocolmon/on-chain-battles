// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

interface IEventLoggerV1 {
    struct Log {
        uint256 id;
        uint256 action;
        bytes data;
        uint256 timestamp;
        address player;
        uint256 round;
    }

    struct DisplayLog {
        Log log;
        uint256 matchId;
    }

    event LogEvent(uint256 id, uint256 matchId, uint256 action, uint256 timestamp, bytes data, address player, uint256 round);

    function log(uint256 action, uint256 val) external;

    function log(uint256 action, address addr) external;

    function log(uint256 action, address addr, bool b) external;

    function log(uint256 action, address addr, bytes32 b) external;

    function log(uint256 action, address addr1, address addr2) external;

    function log(uint256 action, address addr1, address addr2, bool b) external;

    function log(uint256 action, address addr, uint256 val1, uint256 val2) external;

    function log(uint256 action, address addr, uint256 val1, uint256 val2, uint256 val3) external;

    function log(uint256 action, address addr, uint256 val1, uint256 val2, uint256 val3, uint256 val4, bool b) external;

    function setCurrentMoveExecutor(address player) external;

    function setMatchId(uint256 matchId) external;

    function setRound(uint256 round) external;
}
