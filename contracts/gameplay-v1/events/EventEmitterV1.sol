// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./interfaces/IEventEmitterV1.sol";

contract EventEmitterV1 is IEventEmitterV1 {
    // Pagination constants
    uint256 constant MAX_EVENTS = 100;

    mapping(uint256 => bytes[]) public damageLogs;

    mapping(uint256 => bytes[]) public statusEffectLogs;

    function emitBattleLogDamage(
        uint256 attacker,
        uint256 defender,
        address move,
        int16 damage,
        uint16 elementalEffectiveness,
        bool isCritical
    ) external override {
        emit BattleLogDamage(attacker, defender, move, damage, elementalEffectiveness, isCritical);

        bytes memory logData = abi.encode(attacker, defender, move, damage, elementalEffectiveness, isCritical);
        damageLogs[attacker].push(logData);
    }

    function emitBattleLogStatusEffect(
        uint256 player,
        address statusEffect,
        uint256 extraData
    ) external override {
        emit BattleLogStatusEffect(player, statusEffect, extraData);

        bytes memory statusLogData = abi.encode(player, statusEffect, extraData);
        statusEffectLogs[player].push(statusLogData);
    }

    function getEventsForTokens(uint256 tokenId1, uint256 tokenId2, uint256 startIndex, uint256 endIndex)
    public
    view
    returns (string memory)
    {
        require(endIndex <= startIndex + MAX_EVENTS, "Can only fetch up to 100 events at once");

        // Placeholder for the JSON-like structure
        string memory json = "[";

        // Fetch events for tokenId1
        for (uint256 i = startIndex; i < endIndex && i < damageLogs[tokenId1].length; i++) {
            if (i != startIndex) {
                json = string(abi.encodePacked(json, ","));
            }
            json = string(abi.encodePacked(json, "{", "\"name\":\"BattleLogDamage\",\"data\":\"", toHexString(damageLogs[tokenId1][i]), "\"}"));
        }

        for (uint256 i = startIndex; i < endIndex && i < statusEffectLogs[tokenId1].length; i++) {
            json = string(abi.encodePacked(json, ",","{", "\"name\":\"BattleLogStatusEffect\",\"data\":\"", toHexString(statusEffectLogs[tokenId1][i]), "\"}"));
        }

        // Fetch events for tokenId2
        for (uint256 i = startIndex; i < endIndex && i < damageLogs[tokenId2].length; i++) {
            json = string(abi.encodePacked(json, ",","{", "\"name\":\"BattleLogDamage\",\"data\":\"", toHexString(damageLogs[tokenId2][i]), "\"}"));
        }

        for (uint256 i = startIndex; i < endIndex && i < statusEffectLogs[tokenId2].length; i++) {
            json = string(abi.encodePacked(json, ",","{", "\"name\":\"BattleLogStatusEffect\",\"data\":\"", toHexString(statusEffectLogs[tokenId2][i]), "\"}"));
        }

        json = string(abi.encodePacked(json, "]"));
        return json;
    }

    // Helper function to convert bytes to hex string
    function toHexString(bytes memory data) private pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(data.length * 2);
        for (uint i = 0; i < data.length; i++) {
            bytes1 char = data[i];
            str[i*2] = alphabet[uint(uint8(char >> 4))];
            str[1 + i*2] = alphabet[uint(uint8(char) & 0x0f)];
        }
        return string(str);
    }
}
