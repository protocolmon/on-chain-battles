// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./interfaces/IEventLoggerV1.sol";

contract EventLoggerV1 is IEventLoggerV1 {
    uint256 private count;
    uint256 private currentMatchId;
    address private currentMoveExecutor;
    address private currentMoveOpponent;
    uint256 private currentMoveExecutorMonster;
    uint256 private currentMoveOpponentMonster;
    uint256 private currentRound;

    mapping(uint256 => Log[]) public logsByMatchId;

    modifier hasMatchId() {
        require(currentMatchId != 0, "No match id");
        _;
    }

    function log(uint256 action, uint256 val) external hasMatchId {
        bytes memory data = abi.encode(val);
        _storeLog(action, data);
    }

    function log(uint256 action, address addr) external hasMatchId {
        bytes memory data = abi.encode(addr);
        _storeLog(action, data);
    }

    function log(uint256 action, address addr, bool b) external hasMatchId {
        bytes memory data = abi.encode(addr, b);
        _storeLog(action, data);
    }

    function log(uint256 action, address addr, bytes32 b) external hasMatchId {
        bytes memory data = abi.encode(addr, b);
        _storeLog(action, data);
    }

    function log(uint256 action, address addr1, address addr2, bool b) external hasMatchId {
        bytes memory data = abi.encode(addr1, addr2, b);
        _storeLog(action, data);
    }

    function log(uint256 action, address addr1, address addr2) external hasMatchId {
        bytes memory data = abi.encode(addr1, addr2);
        _storeLog(action, data);
    }

    function log(uint256 action, address addr, uint256 val1, uint256 val2) external hasMatchId {
        bytes memory data = abi.encode(addr, val1, val2);
        _storeLog(action, data);
    }

    function log(uint256 action, address addr, uint256 val1, uint256 val2, uint256 val3) external hasMatchId {
        bytes memory data = abi.encode(addr, val1, val2, val3);
        _storeLog(action, data);
    }

    function log(uint256 action, address addr, uint256 val1, uint256 val2, uint256 val3, uint256 val4, bool b) external hasMatchId {
        bytes memory data = abi.encode(addr, val1, val2, val3, val4, b);
        _storeLog(action, data);
    }

    function setCurrentInfo(address executor, address opponent, uint256 executorMonster, uint256 opponentMonster) external override hasMatchId {
        currentMoveExecutor = executor;
        currentMoveOpponent = opponent;
        currentMoveExecutorMonster = executorMonster;
        currentMoveOpponentMonster = opponentMonster;
    }

    function setMatchId(uint256 matchId) external override {
        currentMatchId = matchId;
    }

    function setRound(uint256 round) external override hasMatchId {
        currentRound = round;
    }

    function _storeLog(uint256 action, bytes memory data) internal {
        Log memory newLog = Log({
            id: count++,
            action: action,
            data: data,
            timestamp: block.timestamp,
            player: currentMoveExecutor,
            opponent: currentMoveOpponent,
            monster: currentMoveExecutorMonster,
            opponentMonster: currentMoveOpponentMonster,
            round: currentRound
        });

        logsByMatchId[currentMatchId].push(newLog);

        emit LogEvent(
            count,
            currentMatchId,
            action,
            block.timestamp,
            data,
            currentMoveExecutor,
            currentMoveOpponent,
            currentMoveExecutorMonster,
            currentMoveOpponentMonster,
            currentRound
        );
    }

    function getLogs(uint256 matchId, uint256 offset) external view returns (Log[] memory) {
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
