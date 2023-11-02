// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

library LogActions {
    enum Action {
        None,
        AddStatusEffect,
        ApplyMonsterStatusEffect,
        ApplyMoveStatusEffect,
        ApplyOtherStatusEffect,
        Damage,
        Heal,
        RemoveStatusEffectsByGroup
    }
}
