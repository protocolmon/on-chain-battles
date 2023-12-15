// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IEventLoggerV1.sol";

contract EventLoggerV1 is Ownable, IEventLoggerV1 {
    uint256 private count;
    uint256 private currentMatchId;
    address private currentMoveExecutor;
    address private currentMoveOpponent;
    uint256 private currentMoveExecutorMonster;
    uint256 private currentMoveOpponentMonster;
    uint256 private currentRound;

    mapping(uint256 => Log[]) public logsByMatchId;

    /// @dev Addresses that are allowed to write logs
    mapping(address => bool) public writers;

    modifier hasMatchId() {
        require(currentMatchId != 0, "EventLoggerV1: No match id");
        _;
    }

    modifier isWriter() {
        require(writers[msg.sender], "EventLoggerV1: Not a writer");
        _;
    }

    constructor(address owner) Ownable(owner) {}

    function log(uint256 action, uint256 val) external hasMatchId isWriter {
        bytes memory data = abi.encode(val);
        _storeLog(action, data);
    }

    function log(uint256 action, address addr) external hasMatchId isWriter {
        bytes memory data = abi.encode(addr);
        _storeLog(action, data);
    }

    function log(
        uint256 action,
        address addr,
        bool b
    ) external hasMatchId isWriter {
        bytes memory data = abi.encode(addr, b);
        _storeLog(action, data);
    }

    function log(
        uint256 action,
        address addr,
        bytes32 b
    ) external hasMatchId isWriter {
        bytes memory data = abi.encode(addr, b);
        _storeLog(action, data);
    }

    function log(
        uint256 action,
        address addr1,
        address addr2,
        bool b
    ) external hasMatchId isWriter {
        bytes memory data = abi.encode(addr1, addr2, b);
        _storeLog(action, data);
    }

    function log(
        uint256 action,
        address addr1,
        address addr2
    ) external hasMatchId isWriter {
        bytes memory data = abi.encode(addr1, addr2);
        _storeLog(action, data);
    }

    function log(
        uint256 action,
        address addr,
        uint256 val1,
        uint256 val2
    ) external hasMatchId isWriter {
        bytes memory data = abi.encode(addr, val1, val2);
        _storeLog(action, data);
    }

    function log(
        uint256 action,
        address addr,
        uint256 val1,
        uint256 val2,
        uint256 val3
    ) external hasMatchId isWriter {
        bytes memory data = abi.encode(addr, val1, val2, val3);
        _storeLog(action, data);
    }

    function log(
        uint256 action,
        address addr,
        uint256 val1,
        uint256 val2,
        uint256 val3,
        uint256 val4,
        bool b
    ) external hasMatchId isWriter {
        bytes memory data = abi.encode(addr, val1, val2, val3, val4, b);
        _storeLog(action, data);
    }

    function resetCurrentInfo() external override hasMatchId isWriter {
        currentMoveExecutor = address(0);
        currentMoveOpponent = address(0);
        currentMoveExecutorMonster = 0;
        currentMoveOpponentMonster = 0;
    }

    function setCurrentInfo(
        address executor,
        address opponent,
        uint256 executorMonster,
        uint256 opponentMonster
    ) external override hasMatchId isWriter {
        currentMoveExecutor = executor;
        currentMoveOpponent = opponent;
        currentMoveExecutorMonster = executorMonster;
        currentMoveOpponentMonster = opponentMonster;
    }

    function setMatchId(uint256 matchId) external override isWriter {
        currentMatchId = matchId;
    }

    function setRound(uint256 round) external override hasMatchId isWriter {
        currentRound = round;
    }

    /**************************************************************************
     * ADMIN FUNCTIONS
     *************************************************************************/

    function addWriter(address writer) external onlyOwner {
        writers[writer] = true;
    }

    /**************************************************************************
     * INTERNAL FUNCTIONS
     *************************************************************************/

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

    /**************************************************************************
     * VIEW FUNCTIONS
     *************************************************************************/

    function getLogs(
        uint256 matchId,
        uint256 offset
    ) external view returns (Log[] memory) {
        if (offset >= logsByMatchId[matchId].length) {
            return new Log[](0); // Return an empty array if the offset is beyond the available logs
        }

        uint256 endIndex = offset + 100 > logsByMatchId[matchId].length
            ? logsByMatchId[matchId].length
            : offset + 100;
        uint256 length = endIndex - offset;
        Log[] memory logsToReturn = new Log[](length);

        for (uint256 i = 0; i < length; i++) {
            logsToReturn[i] = logsByMatchId[matchId][offset + i];
        }

        return logsToReturn;
    }
}
