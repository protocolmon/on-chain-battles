// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import {IBaseStatusEffectV1} from "../interfaces/IBaseStatusEffectV1.sol";

library MoveLibV1 {
    function addStatusEffect(
        IBaseStatusEffectV1.StatusEffectWrapper[] memory statusEffects,
        IBaseStatusEffectV1.StatusEffectWrapper memory newEffect
    ) internal view returns (IBaseStatusEffectV1.StatusEffectWrapper[] memory) {
        // Check if effect with the same name exists and is unique
        int256 indexOfExistingEffect = -1;
        for (uint256 i = 0; i < statusEffects.length; i++) {
            if (
                keccak256(
                    abi.encodePacked(statusEffects[i].statusEffect.name())
                ) ==
                keccak256(abi.encodePacked(newEffect.statusEffect.name())) &&
                statusEffects[i].statusEffect.isUnique()
            ) {
                indexOfExistingEffect = int256(i);
                break;
            }
        }

        // Decide the size of the new array based on whether we found a duplicate
        uint256 newSize;
        if (indexOfExistingEffect >= 0) {
            newSize = statusEffects.length; // No change in size, as we are replacing an effect
        } else {
            newSize = statusEffects.length + 1; // Increase size as we're adding a new effect
        }

        IBaseStatusEffectV1.StatusEffectWrapper[]
            memory newStatusEffects = new IBaseStatusEffectV1.StatusEffectWrapper[](
                newSize
            );

        uint256 j = 0;
        for (uint256 i = 0; i < statusEffects.length; i++) {
            // If this is the effect we want to replace, skip copying it
            if (int256(i) == indexOfExistingEffect) {
                continue;
            }
            newStatusEffects[j] = statusEffects[i];
            j++;
        }

        // Add the new effect to the end
        newStatusEffects[j] = newEffect;

        return newStatusEffects;
    }

    function removeStatusEffectsByGroup(
        IBaseStatusEffectV1.StatusEffectWrapper[] memory statusEffects,
        IBaseStatusEffectV1.StatusEffectGroup group
    ) internal view returns (IBaseStatusEffectV1.StatusEffectWrapper[] memory) {
        for (uint256 i = 0; i < statusEffects.length; i++) {
            if (statusEffects[i].statusEffect.group() == group) {
                delete statusEffects[i];
            }
        }
        return _cleanUpStatusEffects(statusEffects);
    }

    function _cleanUpStatusEffects(
        IBaseStatusEffectV1.StatusEffectWrapper[] memory statusEffects
    ) internal pure returns (IBaseStatusEffectV1.StatusEffectWrapper[] memory) {
        uint256 numStatusEffects = 0;
        for (uint256 i = 0; i < statusEffects.length; i++) {
            if (
                statusEffects[i].statusEffect != IBaseStatusEffectV1(address(0))
            ) {
                numStatusEffects++;
            }
        }
        IBaseStatusEffectV1.StatusEffectWrapper[]
            memory newStatusEffects = new IBaseStatusEffectV1.StatusEffectWrapper[](
                numStatusEffects
            );
        uint256 j = 0;
        for (uint256 i = 0; i < statusEffects.length; i++) {
            if (
                statusEffects[i].statusEffect != IBaseStatusEffectV1(address(0))
            ) {
                newStatusEffects[j] = statusEffects[i];
                j++;
            }
        }
        return newStatusEffects;
    }
}
