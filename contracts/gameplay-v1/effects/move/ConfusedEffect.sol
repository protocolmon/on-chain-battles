// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/BaseMoveStatusEffectWithoutStorageV1.sol";

contract ConfusedEffect is BaseMoveStatusEffectWithoutStorageV1 {
    mapping(address => address) private moveToConfusedMove;

    constructor(address[] memory _moves, address[] memory _confusedMoves) {
        require(
            _moves.length == _confusedMoves.length,
            "ConfusedEffect: moves and confusedMoves length mismatch"
        );
        for (uint256 i = 0; i < _moves.length; i++) {
            moveToConfusedMove[_moves[i]] = _confusedMoves[i];
        }
    }

    function applyEffect(
        IMoveV1 move,
        uint256 randomness
    ) external view override returns (IMoveV1) {
        // 30% change to miss attack
        if (
            move.moveType() == IMoveV1.MoveType.Damage &&
            isRandomHit(randomness, name(), 30) &&
            moveToConfusedMove[address(move)] != address(0)
        ) {
            return IMoveV1(moveToConfusedMove[address(move)]);
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

    function stage() external pure override returns (Stage) {
        return Stage.ATTACK;
    }

    function name() public pure override returns (string memory) {
        return "confused";
    }
}
