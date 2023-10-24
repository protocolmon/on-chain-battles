// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../lib/RandomnessLibV1.sol";
import { IEventEmitterV1 } from "../gameplay-v1/events/interfaces/IEventEmitterV1.sol";

abstract contract GamePlayItem {
    IEventEmitterV1 internal eventEmitter;

    function isRandomHit(
        uint256 seed,
        string memory salt,
        uint8 chance
    ) internal pure returns (bool) {
        return RandomnessLibV1.isRandomHit(seed, salt, chance);
    }

    function setEventEmitter(IEventEmitterV1 _eventEmitter) external {
        eventEmitter = _eventEmitter;
    }

    function emitBattleLogDamage(
        uint256 attacker,
        uint256 defender,
        address move,
        uint256 damage,
        uint16 elementalEffectiveness,
        bool isCritical
    ) internal {
        if (address(eventEmitter) == address(0)) return;

        eventEmitter.emitBattleLogDamage(
            attacker,
            defender,
            move,
            damage,
            elementalEffectiveness,
            isCritical
        );
    }

    function emitBattleLogStatusEffect(
        uint256 player,
        address statusEffect,
        uint256 extraData
    ) internal {
        if (address(eventEmitter) == address(0)) return;

        eventEmitter.emitBattleLogStatusEffect(
            player,
            statusEffect,
            extraData
        );
    }
}
