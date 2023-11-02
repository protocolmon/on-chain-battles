// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/MoveWithStorageV1.sol";
import { LogActions } from "../../lib/LogActions.sol";

contract HealMove is MoveWithStorageV1 {
    function execute(
        MoveInput memory input
    ) external returns (MoveOutput memory) {
        uint16 prevHeal = bytesToUint16(store[input.attacker.tokenId]);
        int16 heal = prevHeal == 0 ? int16(40) : int16(prevHeal) / 2;
        store[input.attacker.tokenId] = abi.encodePacked(heal);

        logger.log(
            uint256(LogActions.Action.Heal),
            address(this),
            input.attacker.tokenId,
            uint256(uint16(heal))
        );

        return
            MoveOutput(
                input.attackerStatusEffects,
                input.defenderStatusEffects,
                -heal,
                0
            );
    }

    function moveType() external pure returns (MoveType) {
        return MoveType.Boost;
    }
}
