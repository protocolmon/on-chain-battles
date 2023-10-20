// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../lib/RandomnessLibV1.sol";

abstract contract GamePlayItem {
    function isRandomHit(
        uint256 seed,
        string memory salt,
        uint8 chance
    ) internal pure returns (bool) {
        return RandomnessLibV1.isRandomHit(seed, salt, chance);
    }
}
