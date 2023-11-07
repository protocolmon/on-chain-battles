// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import { IEventLoggerV1 } from "./IEventLoggerV1.sol";
import { IMonsterV1 } from "./IMonsterV1.sol";
import { IMoveV1 } from "./IMoveV1.sol";
import { IBaseStatusEffectV1 } from "./IBaseStatusEffectV1.sol";

interface IMoveExecutorV1 {
    struct WrappedMove {
        IMoveV1 move;
        address player;
    }

    struct WrappedMoves {
        WrappedMove challenger;
        WrappedMove opponent;
    }

    function executeMoves(
        IMonsterV1.Monster memory challenger,
        IMonsterV1.Monster memory opponent,
        WrappedMoves memory moves,
        IBaseStatusEffectV1.StatusEffectWrapper[]
            memory challengerStatusEffects,
        IBaseStatusEffectV1.StatusEffectWrapper[] memory opponentStatusEffects,
        uint256 randomness,
        IEventLoggerV1 eventLogger
    )
        external
        returns (
            IMonsterV1.Monster memory,
            IMonsterV1.Monster memory,
            IBaseStatusEffectV1.StatusEffectWrapper[] memory,
            IBaseStatusEffectV1.StatusEffectWrapper[] memory
        );
}
