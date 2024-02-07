// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./BaseStatusEffectWithStorageV1.sol";
import "../interfaces/IMonsterStatusEffectV1.sol";

abstract contract BaseMonsterStatusEffectWithStorageV1 is
    BaseStatusEffectWithStorageV1,
    IMonsterStatusEffectV1
{
    function extraData() external view override returns (uint256) {
        return 0;
    }

    function extraData(uint256) external view override returns (uint256) {
        return 0;
    }

    function rewindEffect(
        IMonsterV1.Monster memory monster,
        uint256 randomness
    ) external view returns (IMonsterV1.Monster memory) {
        return monster;
    }

    function statusEffectType() external view returns (StatusEffectType) {
        return StatusEffectType.MONSTER;
    }
}
