// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";
import {LogActions} from "../../lib/LogActions.sol";

contract CleansingShieldMove is MoveV1 {
    function execute(
        IMoveV1.MoveInput memory input
    ) external onlyExecutor returns (IMoveV1.MoveOutput memory) {
        input.attackerStatusEffects = MoveLibV1.removeStatusEffectsByGroup(
            input.attackerStatusEffects,
            IBaseStatusEffectV1.StatusEffectGroup.DEBUFF
        );

        logger.log(
            uint256(LogActions.Action.RemoveStatusEffectsByGroup),
            address(this),
            input.attacker.tokenId,
            uint256(IBaseStatusEffectV1.StatusEffectGroup.DEBUFF)
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
