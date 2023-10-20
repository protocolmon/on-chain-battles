// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../lib/RandomnessLibV1.sol";
import { IBaseStatusEffectV1 } from "../../interfaces/IBaseStatusEffectV1.sol";

library CriticalHit {
    function applyCriticalHit(
        uint16 damage,
        uint256 randomness,
        IBaseStatusEffectV1.StatusEffectWrapper[] memory statusEffects
    ) internal view returns (uint16 returnDamage) {
        bool isCriticalHitDueToEffect = false;
        for (uint256 i = 0; i < statusEffects.length; i++) {
            if (
                keccak256(
                    abi.encodePacked(statusEffects[i].statusEffect.name())
                ) == keccak256(abi.encodePacked("tailwind"))
            ) {
                isCriticalHitDueToEffect = statusEffects[i]
                    .statusEffect
                    .applyEffect(randomness);
                if (isCriticalHitDueToEffect) break;
            }
        }

        bool isCriticalHit = isCriticalHitDueToEffect ||
            RandomnessLibV1.isRandomHit(randomness, "criticalHitNoEffect", 5); // otherwise 5%

        returnDamage = isCriticalHit ? (damage * 3) / 2 : damage;
    }
}
