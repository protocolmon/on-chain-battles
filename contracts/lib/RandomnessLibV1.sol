// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

library RandomnessLibV1 {
    function isRandomHit(
        uint256 seed,
        string memory salt,
        uint8 chance
    ) internal pure returns (bool) {
        uint256 random = uint256(keccak256(abi.encodePacked(seed, salt)));
        return random % 100 < chance;
    }
}
