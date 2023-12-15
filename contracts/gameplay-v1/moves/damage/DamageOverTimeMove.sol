// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";
import "../../lib/ElementalEffectiveness.sol";
import "../../lib/CriticalHit.sol";
import "../../lib/BaseDamage.sol";
import {LogActions} from "../../lib/LogActions.sol";

contract DamageOverTimeMove is MoveV1 {
    uint8 public constant DAMAGE_OVER_TIME_DURATION = 3;

    IBaseStatusEffectV1 public damageOverTimeEffect;
    uint8 public chance;

    constructor(IBaseStatusEffectV1 _damageOverTimeEffect, uint8 _chance) {
        damageOverTimeEffect = _damageOverTimeEffect;
        chance = _chance;
    }

    function execute(
        IMoveV1.MoveInput memory input
    ) external onlyExecutor returns (IMoveV1.MoveOutput memory) {
        uint16 damage = BaseDamage.calculateBaseDamage(
            input.attacker,
            input.defender
        );

        uint16 elementalMultiplier;
        (damage, elementalMultiplier) = ElementalEffectiveness
            .applyElementalEffectiveness(
                damage,
                input.attacker.element,
                input.attacker.element,
                input.defender.element
            );

        bool logEffect = false;
        if (isRandomHit(input.randomness, "damageOverTime", chance)) {
            damageOverTimeEffect.storeInfo(
                input.defender.tokenId,
                abi.encode(uint16(damage / 5))
            );
            input.defenderStatusEffects = MoveLibV1.addStatusEffect(
                input.defenderStatusEffects,
                IBaseStatusEffectV1.StatusEffectWrapper(
                    damageOverTimeEffect,
                    DAMAGE_OVER_TIME_DURATION
                )
            );
            logEffect = true;
        }

        // finally apply the potential critical hit after the damage over time effect
        bool isCriticalHit;
        (damage, isCriticalHit) = CriticalHit.applyCriticalHit(
            damage,
            input.randomness,
            input.attackerStatusEffects
        );

        logger.log(
            uint256(LogActions.Action.Damage),
            address(this),
            input.attacker.tokenId,
            input.defender.tokenId,
            uint256(damage),
            uint256(elementalMultiplier),
            isCriticalHit
        );

        if (logEffect) {
            logger.log(
                uint256(LogActions.Action.AddStatusEffect),
                address(damageOverTimeEffect),
                input.defender.tokenId,
                DAMAGE_OVER_TIME_DURATION
            );
        }

        return
            IMoveV1.MoveOutput(
                input.attackerStatusEffects,
                input.defenderStatusEffects,
                0,
                int16(damage)
            );
    }

    function moveType() external pure returns (MoveType) {
        return MoveType.Damage;
    }
}
