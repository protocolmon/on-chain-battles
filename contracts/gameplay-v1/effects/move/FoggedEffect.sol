// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/BaseMoveStatusEffectWithoutStorageV1.sol";

contract FoggedEffect is BaseMoveStatusEffectWithoutStorageV1 {
    function applyEffect(
        IMoveV1 move,
        uint256 randomness
    ) external view returns (IMoveV1) {
        // 30% change to miss attack
        if (
            move.moveType() == IMoveV1.MoveType.Damage &&
            isRandomHit(randomness, name(), 30)
        ) {
            return IMoveV1(address(0));
        }
        return move;
    }

    function group()
        external
        pure
        override
        returns (IBaseStatusEffectV1.StatusEffectGroup)
    {
        return IBaseStatusEffectV1.StatusEffectGroup.DEBUFF;
    }

    function stage() external pure returns (Stage) {
        return Stage.ATTACK;
    }

    function name() public pure returns (string memory) {
        return "fogged";
    }
}
