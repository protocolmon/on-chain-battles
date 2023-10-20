// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./GamePlayItemV1.sol";
import { IBaseStatusEffectV1 } from "../interfaces/IBaseStatusEffectV1.sol";

abstract contract BaseStatusEffectWithoutStorageV1 is
    GamePlayItem,
    IBaseStatusEffectV1
{
    function applyEffect(
        uint256
    ) external view virtual override returns (bool) {
        // no nothing, just a base implementation
        return false;
    }

    function isUnique() external pure virtual override returns (bool) {
        return true;
    }

    function storeInfo(uint256, bytes memory) external override {
        revert("StatusEffectWithStorageV1: no storage");
    }

    function wrap(
        uint8 remainingTurns
    )
        external
        view
        override
        returns (IBaseStatusEffectV1.StatusEffectWrapper memory)
    {
        return
            IBaseStatusEffectV1.StatusEffectWrapper({
                statusEffect: IBaseStatusEffectV1(this),
                remainingTurns: remainingTurns
            });
    }
}
