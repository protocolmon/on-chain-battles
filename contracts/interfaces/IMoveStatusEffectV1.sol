// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import {IMoveV1} from "./IMoveV1.sol";

interface IMoveStatusEffectV1 {
    enum Stage {
        ATTACK,
        DEFENSE
    }

    function applyEffect(
        IMoveV1 move,
        uint256 randomness
    ) external returns (IMoveV1);

    /// @dev When to execute this status effect
    function stage() external view returns (Stage);

    /// @dev If the status effects transits to the next monster if the first monster was defeated
    function transits() external view returns (bool);
}
