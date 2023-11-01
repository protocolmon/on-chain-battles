// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./interfaces/IEventLoggerV1.sol";

contract EventLoggerV1 is IEventLoggerV1 {
    uint256 private currentMatchId;

    mapping(uint256 => Log[]) public logsByMatchId;

    modifier hasMatchId() {
        require(currentMatchId != 0, "No match id");
        _;
    }

    function log(string memory name, uint256 val) external hasMatchId {
        bytes memory data = abi.encode(val);
        _storeLog(name, data);
    }

    function log(string memory name, address addr) external hasMatchId {
        bytes memory data = abi.encode(addr);
        _storeLog(name, data);
    }

    function log(string memory name, address addr, bool b) external hasMatchId {
        bytes memory data = abi.encode(addr, b);
        _storeLog(name, data);
    }

    function log(string memory name, address addr, bytes32 b) external hasMatchId {
        bytes memory data = abi.encode(addr, b);
        _storeLog(name, data);
    }

    function log(string memory name, address addr1, address addr2, bool b) external hasMatchId {
        bytes memory data = abi.encode(addr1, addr2, b);
        _storeLog(name, data);
    }

    function log(string memory name, address addr1, address addr2) external hasMatchId {
        bytes memory data = abi.encode(addr1, addr2);
        _storeLog(name, data);
    }

    function log(string memory name, address addr, uint256 val1, uint256 val2) external hasMatchId {
        bytes memory data = abi.encode(addr, val1, val2);
        _storeLog(name, data);
    }

    function log(string memory name, address addr, uint256 val1, uint256 val2, uint256 val3) external hasMatchId {
        bytes memory data = abi.encode(addr, val1, val2, val3);
        _storeLog(name, data);
    }

    function log(string memory name, address addr, uint256 val1, uint256 val2, uint256 val3, uint256 val4, bool b) external hasMatchId {
        bytes memory data = abi.encode(addr, val1, val2, val3, val4, b);
        _storeLog(name, data);
    }

    function setMatchId(uint256 matchId) external {
        currentMatchId = matchId;
    }

    function _storeLog(string memory name, bytes memory data) internal {
        Log memory newLog = Log({
            name: name,
            data: data,
            timestamp: block.timestamp
        });

        logsByMatchId[currentMatchId].push(newLog);

        emit LogEvent(currentMatchId, name, data);
    }

    function getLogs(uint256 matchId, uint256 offset) external view returns (Log[] memory) {
        require(matchId > 0, "Invalid match id");
        if (offset >= logsByMatchId[matchId].length) {
            return new Log[](0); // Return an empty array if the offset is beyond the available logs
        }

        uint256 endIndex = offset + 100 > logsByMatchId[matchId].length ? logsByMatchId[matchId].length : offset + 100;
        uint256 length = endIndex - offset;
        Log[] memory logsToReturn = new Log[](length);

        for (uint256 i = 0; i < length; i++) {
            logsToReturn[i] = logsByMatchId[matchId][offset + i];
        }

        return logsToReturn;
    }
}
