// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/BaseMoveStatusEffectWithoutStorageV1.sol";

contract ConfusedEffect is BaseMoveStatusEffectWithoutStorageV1 {
    mapping(address => address) private moveToConfusedMove;

    function applyEffect(
        IMoveV1 move,
        uint256 randomness
    ) external override returns (IMoveV1 returnMove) {
        returnMove = move;

        bool isHit = move.moveType() == IMoveV1.MoveType.Damage &&
            isRandomHit(randomness, name(), 30) &&
            moveToConfusedMove[address(move)] != address(0);

        if (isHit) {
            returnMove = IMoveV1(moveToConfusedMove[address(move)]);
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

    function stage() external pure override returns (Stage) {
        return Stage.ATTACK;
    }

    function name() public pure override returns (string memory) {
        return "confused";
    }

    function addConfusedMove(IMoveV1 move, IMoveV1 confusedMove) external {
        moveToConfusedMove[address(move)] = address(confusedMove);
    }
}
