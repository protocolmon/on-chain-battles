// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./GamePlayItemV1.sol";
import { IBaseStatusEffectV1 } from "../interfaces/IBaseStatusEffectV1.sol";

abstract contract BaseStatusEffectWithStorageV1 is GamePlayItem, IBaseStatusEffectV1 {
    mapping(uint256 => bytes) internal store;

    function applyEffect(
        uint256 randomness
    ) external view override returns (bool) {
        // no nothing, just a base implementation
        return false;
    }

    function isUnique() external pure virtual override returns (bool) {
        return true;
    }

    function storeInfo(uint256 monsterId, bytes memory info) external override {
        store[monsterId] = info;
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
            StatusEffectWrapper({
                statusEffect: this,
                remainingTurns: remainingTurns
            });
    }
}
