// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";
import "../../lib/BaseDamage.sol";
import "../../lib/CriticalHit.sol";
import "../../lib/ElementalEffectiveness.sol";

contract WallBreakerMove is MoveV1 {
    function execute(
        IMoveV1.MoveInput memory input
    ) external view returns (IMoveV1.MoveOutput memory) {
        uint16 damage = BaseDamage.calculateBaseDamage(
            input.attacker,
            input.defender
        );

        damage = ElementalEffectiveness.applyElementalEffectiveness(
            damage,
            input.attacker.element,
            getSecondElement(input.attacker.element),
            input.defender.element
        );

        // 80% chance that wall is broken
        if (isRandomHit(input.randomness, "wallBreaker", 80)) {
            input.attackerStatusEffects = MoveLibV1.removeStatusEffectsByGroup(
                input.attackerStatusEffects,
                IBaseStatusEffectV1.StatusEffectGroup.WALL
            );
        }

        // finally apply the potential critical hit after the damage over time effect
        damage = CriticalHit.applyCriticalHit(
            damage,
            input.randomness,
            input.attackerStatusEffects
        );

        return
            MoveOutput(
                input.attackerStatusEffects,
                input.defenderStatusEffects,
                0,
                int16(damage)
            );
    }

    function moveType() external pure returns (MoveType) {
        return MoveType.Damage;
    }

    function getSecondElement(
        IMonsterV1.Element element
    ) internal pure returns (IMonsterV1.Element secondElement) {
        if (element == IMonsterV1.Element.Fire) {
            secondElement = IMonsterV1.Element.Toxic;
        } else if (element == IMonsterV1.Element.Nature) {
            secondElement = IMonsterV1.Element.Electric;
        } else if (element == IMonsterV1.Element.Water) {
            secondElement = IMonsterV1.Element.Mental;
        } else {
            secondElement = IMonsterV1.Element.None;
        }
    }
}
