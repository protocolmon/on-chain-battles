// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveV1.sol";
import {LogActions} from "../../lib/LogActions.sol";

contract TimeoutMove is MoveV1 {
    function execute(
        IMoveV1.MoveInput memory input
    ) external onlyExecutor returns (IMoveV1.MoveOutput memory) {
        return
            IMoveV1.MoveOutput(
                input.attackerStatusEffects,
                input.defenderStatusEffects,
                0,
                0
            );
    }

    function moveType() external pure returns (MoveType) {
        return MoveType.Timeout;
    }
}
