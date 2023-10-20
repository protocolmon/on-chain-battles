// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./BaseStatusEffectWithStorageV1.sol";
import "../interfaces/IMoveStatusEffectV1.sol";

abstract contract BaseMoveStatusEffectWithStorageV1 is
    BaseStatusEffectWithStorageV1,
    IMoveStatusEffectV1
{
    function transits() external view virtual returns (bool) {
        return false;
    }

    function statusEffectType() external view returns (StatusEffectType) {
        return StatusEffectType.MONSTER;
    }
}
