// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";

contract DefenseAuraMove is MoveV1 {
    IBaseStatusEffectV1 public defenseAuraEffect;

    constructor(IBaseStatusEffectV1 _defenseAuraEffect) {
        defenseAuraEffect = _defenseAuraEffect;
    }

    function execute(
        MoveInput memory input
    ) external returns (MoveOutput memory) {
        input.attackerStatusEffects = MoveLibV1.addStatusEffect(
            input.attackerStatusEffects,
            IBaseStatusEffectV1.StatusEffectWrapper(
                defenseAuraEffect,
                type(uint8).max
            )
        );

        logger.log(
            "SE+",
            address(defenseAuraEffect),
            input.attacker.tokenId,
            type(uint8).max
        );

        return
            MoveOutput(
                input.attackerStatusEffects,
                input.defenderStatusEffects,
                0,
                0
            );
    }

    function moveType() external pure returns (MoveType) {
        return MoveType.Boost;
    }
}
