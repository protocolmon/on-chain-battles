// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import {IMonsterV1} from "./IMoveV1.sol";

interface IMonsterStatusEffectV1 {
    enum Stage {
        INSTANT, // right after execution, todo can be removed
        PRE_MOVE,
        POST_MOVE
    }

    function applyEffect(
        IMonsterV1.Monster memory monster,
        uint256 randomness
    ) external returns (IMonsterV1.Monster memory);

    function rewindEffect(
        IMonsterV1.Monster memory monster,
        uint256 randomness
    ) external view returns (IMonsterV1.Monster memory);

    /// @dev When to execute this status effect
    function stage() external view returns (Stage);
}
