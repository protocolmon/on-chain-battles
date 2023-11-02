// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";
import { LogActions } from "../../lib/LogActions.sol";

contract AttackAuraMove is MoveV1 {
    IBaseStatusEffectV1 public attackAuraEffect;

    constructor(IBaseStatusEffectV1 _attackAuraEffect) {
        attackAuraEffect = _attackAuraEffect;
    }

    function execute(
        MoveInput memory input
    ) external returns (MoveOutput memory) {
        input.attackerStatusEffects = MoveLibV1.addStatusEffect(
            input.attackerStatusEffects,
            IBaseStatusEffectV1.StatusEffectWrapper(
                attackAuraEffect,
                type(uint8).max
            )
        );

        logger.log(
            uint256(LogActions.Action.AddStatusEffect),
            address(attackAuraEffect),
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
