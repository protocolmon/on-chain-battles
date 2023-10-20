// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";

contract CloudCoverMove is MoveV1 {
    IBaseStatusEffectV1 public immutable cloudCoverEffect;

    constructor(IBaseStatusEffectV1 _cloudCoverEffect) {
        cloudCoverEffect = _cloudCoverEffect;
    }

    function execute(
        IMoveV1.MoveInput memory input
    ) external view returns (IMoveV1.MoveOutput memory) {
        input.attackerStatusEffects = MoveLibV1.addStatusEffect(
            // attacker is the executor of the elemental wall here
            input.attackerStatusEffects,
            // will count in current turn and next turn
            IBaseStatusEffectV1.StatusEffectWrapper(cloudCoverEffect, 3)
        );

        return
            IMoveV1.MoveOutput(
                input.attackerStatusEffects,
                input.defenderStatusEffects,
                0,
                0
            );
    }

    function moveType() external pure returns (MoveType) {
        return MoveType.Shield;
    }
}
