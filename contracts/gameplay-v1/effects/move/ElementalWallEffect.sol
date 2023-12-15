// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/BaseMoveStatusEffectWithoutStorageV1.sol";
import {LogActions} from "../../lib/LogActions.sol";

contract ElementalWallEffect is BaseMoveStatusEffectWithoutStorageV1 {
    IMoveV1 public immutable wallBreakerMove;

    constructor(IMoveV1 _wallBreakerMove) {
        wallBreakerMove = _wallBreakerMove;
    }

    function applyEffect(
        IMoveV1 move,
        uint256
    ) external override onlyExecutor returns (IMoveV1 returnMove) {
        returnMove = move;

        bool isHit = move.moveType() == IMoveV1.MoveType.Damage &&
            move != wallBreakerMove;
        if (isHit) {
            returnMove = IMoveV1(address(0));
        }

        logger.log(
            uint256(LogActions.Action.ApplyMoveStatusEffect),
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
