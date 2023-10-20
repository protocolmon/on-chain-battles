// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/BaseMonsterStatusEffectWithoutStorageV1.sol";

contract DefenseAuraEffect is BaseMonsterStatusEffectWithoutStorageV1 {
    function applyEffect(
        IMonsterV1.Monster memory monster,
        uint256
    ) external view returns (IMonsterV1.Monster memory) {
        monster.defense += 20;

        return monster;
    }

    function rewindEffect(
        IMonsterV1.Monster memory monster,
        uint256
    ) external view override returns (IMonsterV1.Monster memory) {
        monster.defense -= 20;

        return monster;
    }

    function group()
        external
        pure
        override
        returns (IBaseStatusEffectV1.StatusEffectGroup)
    {
        return IBaseStatusEffectV1.StatusEffectGroup.BUFF;
    }

    function isUnique() external pure override returns (bool) {
        return false;
    }

    function stage() external pure override returns (Stage) {
        return Stage.INSTANT;
    }

    function name() external pure override returns (string memory) {
        return "defense-aura";
    }
}
