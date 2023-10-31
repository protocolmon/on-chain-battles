// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

interface IEventEmitterV1 {
    event BattleLogDamage(
        uint256 attacker,
        uint256 defender,
        address move,
        int16 damage,
        uint16 elementalEffectiveness,
        bool isCritical
    );

    event BattleLogStatusEffect(
        uint256 player,
        address statusEffect,
        uint256 extraData
    );

    function emitBattleLogDamage(
        uint256 attacker,
        uint256 defender,
        address move,
        int16 damage,
        uint16 elementalEffectiveness,
        bool isCritical
    ) external;

    function emitBattleLogStatusEffect(
        uint256 player,
        address statusEffect,
        uint256 extraData
    ) external;
}
