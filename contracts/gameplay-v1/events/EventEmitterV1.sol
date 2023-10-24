// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./interfaces/IEventEmitterV1.sol";

contract EventEmitterV1 is IEventEmitterV1 {
    function emitBattleLogDamage(
        uint256 attacker,
        uint256 defender,
        address move,
        uint256 damage,
        uint16 elementalEffectiveness,
        bool isCritical
    ) external override {
        emit BattleLogDamage(attacker, defender, move, damage, elementalEffectiveness, isCritical);
    }

    function emitBattleLogStatusEffect(
        uint256 player,
        address statusEffect,
        uint256 extraData
    ) external override {
        emit BattleLogStatusEffect(player, statusEffect, extraData);
    }
}
