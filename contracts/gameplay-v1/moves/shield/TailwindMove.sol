// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";
import { LogActions } from "../../lib/LogActions.sol";

contract TailwindMove is MoveV1 {
    uint8 public constant TAILWIND_DURATION = 3;

    IBaseStatusEffectV1 public immutable tailwindEffect;

    constructor(IBaseStatusEffectV1 _tailwindEffect) {
        tailwindEffect = _tailwindEffect;
    }

    function execute(
        IMoveV1.MoveInput memory input
    ) external onlyExecutor returns (IMoveV1.MoveOutput memory) {
        input.attackerStatusEffects = MoveLibV1.addStatusEffect(
            // attacker is the executor of the elemental wall here
            input.attackerStatusEffects,
            // will count in current turn and next 2 turns
            IBaseStatusEffectV1.StatusEffectWrapper(tailwindEffect, TAILWIND_DURATION)
        );

        logger.log(
            uint256(LogActions.Action.AddStatusEffect),
            address(tailwindEffect),
            input.attacker.tokenId,
            TAILWIND_DURATION
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
