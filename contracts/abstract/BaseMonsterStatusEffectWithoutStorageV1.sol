// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./BaseStatusEffectWithoutStorageV1.sol";
import "../interfaces/IMonsterStatusEffectV1.sol";

abstract contract BaseMonsterStatusEffectWithoutStorageV1 is
    BaseStatusEffectWithoutStorageV1,
    IMonsterStatusEffectV1
{
    function rewindEffect(
        IMonsterV1.Monster memory monster,
        uint256 randomness
    ) external view virtual returns (IMonsterV1.Monster memory) {
        return monster;
    }

    function statusEffectType() external view returns (StatusEffectType) {
        return StatusEffectType.MONSTER;
    }
}
