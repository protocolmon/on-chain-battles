// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";
import "../../lib/BaseDamage.sol";
import "../../lib/CriticalHit.sol";
import "../../lib/ElementalEffectiveness.sol";
import { LogActions } from "../../lib/LogActions.sol";

contract PurgeBuffsMove is MoveV1 {
    uint8 public immutable chance;

    constructor(uint8 _chance) {
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
        (damage, elementalMultiplier) = ElementalEffectiveness.applyElementalEffectiveness(
            damage,
            input.attacker.element,
            getSecondElement(input.attacker.element),
            input.defender.element
        );

        bool logEffect = false;
        if (isRandomHit(input.randomness, "purgeBuffs", chance)) {
            input.defenderStatusEffects = MoveLibV1.removeStatusEffectsByGroup(
                input.defenderStatusEffects,
                IBaseStatusEffectV1.StatusEffectGroup.BUFF
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
                uint256(LogActions.Action.RemoveStatusEffectsByGroup),
                address(this),
                input.defender.tokenId,
                uint256(IBaseStatusEffectV1.StatusEffectGroup.BUFF)
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

    function getSecondElement(
        IMonsterV1.Element element
    ) internal pure returns (IMonsterV1.Element secondElement) {
        if (element == IMonsterV1.Element.Fire) {
            secondElement = IMonsterV1.Element.Nature;
        } else if (element == IMonsterV1.Element.Nature) {
            secondElement = IMonsterV1.Element.Water;
        } else if (element == IMonsterV1.Element.Water) {
            secondElement = IMonsterV1.Element.Fire;
        } else {
            secondElement = IMonsterV1.Element.None;
        }
    }
}
