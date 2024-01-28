// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/BaseMonsterStatusEffectWithoutStorageV1.sol";
import {LogActions} from "../../lib/LogActions.sol";

contract SpeedAuraEffect is BaseMonsterStatusEffectWithoutStorageV1 {
    uint16 public constant BOOST_VALUE = 20;

    function applyEffect(
        IMonsterV1.Monster memory monster,
        uint256
    ) external view returns (IMonsterV1.Monster memory) {
        monster.speed += BOOST_VALUE;

        return monster;
    }

    function rewindEffect(
        IMonsterV1.Monster memory monster,
        uint256
    ) external view override returns (IMonsterV1.Monster memory) {
        monster.speed -= BOOST_VALUE;

        return monster;
    }

    function extraData() external view override returns (uint256) {
        return BOOST_VALUE;
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
        return "speed-aura";
    }
}
