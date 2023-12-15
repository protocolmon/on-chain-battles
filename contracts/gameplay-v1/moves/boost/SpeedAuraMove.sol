// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";
import {LogActions} from "../../lib/LogActions.sol";

contract SpeedAuraMove is MoveV1 {
    IBaseStatusEffectV1 public speedAuraEffect;

    constructor(IBaseStatusEffectV1 _speedAuraEffect) {
        speedAuraEffect = _speedAuraEffect;
    }

    function execute(
        MoveInput memory input
    ) external onlyExecutor returns (MoveOutput memory) {
        input.attackerStatusEffects = MoveLibV1.addStatusEffect(
            input.attackerStatusEffects,
            IBaseStatusEffectV1.StatusEffectWrapper(
                speedAuraEffect,
                type(uint8).max
            )
        );

        // auras are a special case we we log the apply right after the add because the frontend must
        // show the apply only once
        logger.log(
            uint256(LogActions.Action.ApplyMonsterStatusEffect),
            address(this),
            input.attacker.tokenId,
            speedAuraEffect.extraData()
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
