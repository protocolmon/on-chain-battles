// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";
import { LogActions } from "../../lib/LogActions.sol";

contract ElementalWallMove is MoveV1 {
    uint8 public constant ELEMENTAL_WALL_DURATION = 3;

    IBaseStatusEffectV1 public immutable elementalWallEffect;

    constructor(IBaseStatusEffectV1 _elementalWallEffect) {
        elementalWallEffect = _elementalWallEffect;
    }

    function execute(
        IMoveV1.MoveInput memory input
    ) external returns (IMoveV1.MoveOutput memory) {
        input.attackerStatusEffects = MoveLibV1.addStatusEffect(
            // attacker is the executor of the elemental wall here
            input.attackerStatusEffects,
            // will count in current turn and next turn
            IBaseStatusEffectV1.StatusEffectWrapper(elementalWallEffect, ELEMENTAL_WALL_DURATION)
        );

        logger.log(
            uint256(LogActions.Action.AddStatusEffect),
            address(elementalWallEffect),
            input.attacker.tokenId,
            ELEMENTAL_WALL_DURATION
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
