// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import {IMonsterV1} from "../../interfaces/IMonsterV1.sol";

library BaseDamage {
    int16 constant BASE_DAMAGE_FIXED_VALUE = 50;

    function calculateBaseDamage(
        IMonsterV1.Monster memory attacker,
        IMonsterV1.Monster memory defender
    ) internal pure returns (uint16 damage) {
        int16 baseDamageMin = int16(attacker.attack) - int16(defender.defense);
        if (baseDamageMin < -BASE_DAMAGE_FIXED_VALUE) {
            baseDamageMin = -BASE_DAMAGE_FIXED_VALUE;
        }
        // 50 = base damage fixed value
        damage = uint16(baseDamageMin + BASE_DAMAGE_FIXED_VALUE);
    }
}
