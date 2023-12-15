// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import {IMonsterV1} from "./IMonsterV1.sol";
import {IBaseStatusEffectV1} from "./IBaseStatusEffectV1.sol";

interface IMoveV1 {
    enum MoveType {
        Boost,
        Damage,
        Shield
    }

    struct MoveInput {
        IMonsterV1.Monster attacker;
        IMonsterV1.Monster defender;
        IBaseStatusEffectV1.StatusEffectWrapper[] attackerStatusEffects;
        IBaseStatusEffectV1.StatusEffectWrapper[] defenderStatusEffects;
        uint256 randomness;
    }

    struct MoveOutput {
        IBaseStatusEffectV1.StatusEffectWrapper[] attackerStatusEffects;
        IBaseStatusEffectV1.StatusEffectWrapper[] defenderStatusEffects;
        int16 damageAttacker;
        int16 damageDefender;
    }

    function execute(MoveInput memory io) external returns (MoveOutput memory);

    function moveType() external view returns (MoveType);
}
