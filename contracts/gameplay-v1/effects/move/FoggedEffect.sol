// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/BaseMoveStatusEffectWithoutStorageV1.sol";

contract FoggedEffect is BaseMoveStatusEffectWithoutStorageV1 {
    uint8 public constant CHANCE = 30;

    function applyEffect(
        IMoveV1 move,
        uint256 randomness
    ) external returns (IMoveV1 returnMove) {
        returnMove = move;

        bool isHit = move.moveType() == IMoveV1.MoveType.Damage && isRandomHit(randomness, name(), CHANCE);

        if (isHit) {
            returnMove = IMoveV1(address(0));
        }

        logger.log(
            "SEA",
            address(this),
            address(move),
            isHit
        );
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
