// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

interface IEventLoggerV1 {
    struct Log {
        string name;
        bytes data;
        uint256 timestamp;
    }

    struct DisplayLog {
        Log log;
        uint256 matchId;
    }

    event LogEvent(uint256 indexed matchId, string name, bytes data);

    function log(string memory name, uint256 val) external;

    function log(string memory name, address addr) external;

    function log(string memory name, address addr, bool b) external;

    function log(string memory name, address addr, bytes32 b) external;

    function log(string memory name, address addr1, address addr2) external;

    function log(string memory name, address addr1, address addr2, bool b) external;

    function log(string memory name, address addr, uint256 val1, uint256 val2) external;

    function log(string memory name, address addr, uint256 val1, uint256 val2, uint256 val3) external;

    function log(string memory name, address addr, uint256 val1, uint256 val2, uint256 val3, uint256 val4, bool b) external;

    function setMatchId(uint256 matchId) external;
}
