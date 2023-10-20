// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./GamePlayItemV1.sol";
import "../lib/MoveLibV1.sol";
import "./MoveV1.sol";

abstract contract MoveWithStorageV1 is GamePlayItem, MoveV1 {
    mapping(uint256 => bytes) internal store;

    function bytesToUint16(bytes memory input) internal pure returns (uint16) {
        if (input.length == 0) {
            return 0;
        }
        if (input.length == 1) {
            return uint16(uint8(input[0]));
        }

        require(
            input.length >= 2,
            "MoveWithStorageV1: Input bytes length should be at least 2"
        );

        bytes32 output;
        // Copy bytes to bytes32
        assembly {
            output := mload(add(input, 32))
        }

        return uint16(uint256(output));
    }
}
