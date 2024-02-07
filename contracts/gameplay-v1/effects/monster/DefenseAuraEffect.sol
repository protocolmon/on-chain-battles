// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/BaseMonsterStatusEffectWithoutStorageV1.sol";
import {LogActions} from "../../lib/LogActions.sol";

contract DefenseAuraEffect is BaseMonsterStatusEffectWithoutStorageV1 {
    uint16 public constant BASE_BOOST_VALUE = 20;

    /// @dev How often the effect has been applied
    uint16 private applications;

    function applyEffect(
        IMonsterV1.Monster memory monster,
        uint256
    ) external returns (IMonsterV1.Monster memory) {
        applications++;

        monster.defense += BASE_BOOST_VALUE / applications;

        return monster;
    }

    function rewindEffect(
        IMonsterV1.Monster memory monster,
        uint256
    ) external override returns (IMonsterV1.Monster memory) {
        monster.defense -= BASE_BOOST_VALUE;

        applications--;

        return monster;
    }

    function extraData() external view override returns (uint256) {
        return BASE_BOOST_VALUE;
    }

    function extraData(
        uint256 _applications
    ) external view override returns (uint256) {
        return BASE_BOOST_VALUE / _applications;
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
        return Stage.PRE_MOVE;
    }

    function name() external pure override returns (string memory) {
        return "defense-aura";
    }
}
