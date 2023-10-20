// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/BaseMoveStatusEffectWithoutStorageV1.sol";

contract ElementalWallEffect is BaseMoveStatusEffectWithoutStorageV1 {
    IMoveV1 public immutable wallBreakerMove;

    constructor(IMoveV1 _wallBreakerMove) {
        wallBreakerMove = _wallBreakerMove;
    }

    function applyEffect(
        IMoveV1 move,
        uint256
    ) external view override returns (IMoveV1) {
        if (
            move.moveType() == IMoveV1.MoveType.Damage &&
            move != wallBreakerMove
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
        return IBaseStatusEffectV1.StatusEffectGroup.WALL;
    }

    function stage() external pure override returns (Stage) {
        return Stage.DEFENSE;
    }

    function transits() external view override returns (bool) {
        return true;
    }

    function name() external pure override returns (string memory) {
        return "elemental-wall";
    }
}
