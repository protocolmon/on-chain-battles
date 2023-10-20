// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import { IMonsterV1 } from "./IMonsterV1.sol";
import { IMoveV1 } from "./IMoveV1.sol";
import { IBaseStatusEffectV1 } from "./IBaseStatusEffectV1.sol";

interface IMoveExecutorV1 {
    function executeMoves(
        IMonsterV1.Monster memory challenger,
        IMonsterV1.Monster memory opponent,
        IMoveV1 attackerMove,
        IMoveV1 defenderMove,
        IBaseStatusEffectV1.StatusEffectWrapper[]
            memory challengerStatusEffects,
        IBaseStatusEffectV1.StatusEffectWrapper[] memory opponentStatusEffects,
        uint256 randomness
    )
        external
        returns (
            IMonsterV1.Monster memory,
            IMonsterV1.Monster memory,
            IBaseStatusEffectV1.StatusEffectWrapper[] memory,
            IBaseStatusEffectV1.StatusEffectWrapper[] memory,
            /// @dev The id of the monster that went first
            uint256 firstStrikerId
        );
}
