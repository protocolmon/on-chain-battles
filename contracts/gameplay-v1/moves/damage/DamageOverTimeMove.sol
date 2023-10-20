// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";
import "../../lib/ElementalEffectiveness.sol";
import "../../lib/CriticalHit.sol";
import "../../lib/BaseDamage.sol";

contract DamageOverTimeMove is MoveV1 {
    IBaseStatusEffectV1 public damageOverTimeEffect;
    uint8 public chance;

    constructor(IBaseStatusEffectV1 _damageOverTimeEffect, uint8 _chance) {
        damageOverTimeEffect = _damageOverTimeEffect;
        chance = _chance;
    }

    function execute(
        IMoveV1.MoveInput memory input
    ) external returns (IMoveV1.MoveOutput memory) {
        uint16 damage = BaseDamage.calculateBaseDamage(
            input.attacker,
            input.defender
        );

        // apply elemental effectiveness
        damage = ElementalEffectiveness.applyElementalEffectiveness(
            damage,
            input.attacker.element,
            input.attacker.element,
            input.defender.element
        );

        if (isRandomHit(input.randomness, "damageOverTime", chance)) {
            damageOverTimeEffect.storeInfo(
                input.defender.tokenId,
                abi.encode(uint16(damage / 5))
            );
            input.defenderStatusEffects = MoveLibV1.addStatusEffect(
                input.defenderStatusEffects,
                IBaseStatusEffectV1.StatusEffectWrapper(damageOverTimeEffect, 3)
            );
        }

        // finally apply the potential critical hit after the damage over time effect
        damage = CriticalHit.applyCriticalHit(
            damage,
            input.randomness,
            input.attackerStatusEffects
        );

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
