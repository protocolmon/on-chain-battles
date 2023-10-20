// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import { IMonsterV1 } from "../../interfaces/IMonsterV1.sol";

library BaseDamage {
    function calculateBaseDamage(
        IMonsterV1.Monster memory attacker,
        IMonsterV1.Monster memory defender
    ) internal pure returns (uint16 damage) {
        int16 baseDamageMin = int16(attacker.attack) - int16(defender.defense);
        if (baseDamageMin < 0) {
            baseDamageMin = 0;
        }
        // 50 = base damage fixed value
        damage = uint16(baseDamageMin) + 50;
    }
}
