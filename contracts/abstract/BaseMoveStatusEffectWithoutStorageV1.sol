// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./BaseStatusEffectWithoutStorageV1.sol";
import "../interfaces/IMoveStatusEffectV1.sol";

abstract contract BaseMoveStatusEffectWithoutStorageV1 is
    BaseStatusEffectWithoutStorageV1,
    IMoveStatusEffectV1
{
    function statusEffectType() external pure returns (StatusEffectType) {
        return StatusEffectType.MOVE;
    }

    function transits() external view virtual returns (bool) {
        return false;
    }
}
