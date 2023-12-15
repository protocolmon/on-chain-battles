// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";
import "../../lib/ElementalEffectiveness.sol";
import "../../lib/CriticalHit.sol";
import "../../lib/BaseDamage.sol";
import {LogActions} from "../../lib/LogActions.sol";

contract ControlMove is MoveV1 {
    uint8 public constant FOGGED_DURATION = 3;

    IBaseStatusEffectV1 public foggedEffect;

    constructor(IBaseStatusEffectV1 _foggedEffect) {
        foggedEffect = _foggedEffect;
    }

    function execute(
        MoveInput memory input
    ) external onlyExecutor returns (MoveOutput memory) {
        uint16 damage = BaseDamage.calculateBaseDamage(
            input.attacker,
            input.defender
        );

        uint16 elementalMultiplier;
        (damage, elementalMultiplier) = ElementalEffectiveness
            .applyElementalEffectiveness(
                damage,
                input.attacker.element,
                getSecondElement(input.attacker.element),
                input.defender.element
            );

        // 80% chance to add control effect
        bool logEffect = false;
        if (isRandomHit(input.randomness, "control", 80)) {
            input.defenderStatusEffects = MoveLibV1.addStatusEffect(
                input.defenderStatusEffects,
                IBaseStatusEffectV1.StatusEffectWrapper(
                    foggedEffect,
                    FOGGED_DURATION
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
                address(foggedEffect),
                input.defender.tokenId,
                FOGGED_DURATION
            );
        }

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
            secondElement = IMonsterV1.Element.Electric;
        } else if (element == IMonsterV1.Element.Nature) {
            secondElement = IMonsterV1.Element.Mental;
        } else if (element == IMonsterV1.Element.Water) {
            secondElement = IMonsterV1.Element.Toxic;
        } else {
            secondElement = IMonsterV1.Element.None;
        }
    }
}
