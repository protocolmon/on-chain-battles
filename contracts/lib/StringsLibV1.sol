// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

library StringsLibV1 {
    function toString(address addr)
        internal
        pure
        returns (string memory)
    {
        return Strings.toHexString(uint256(uint160(addr)), 20);
    }

    function toString(bytes32 _bytes32) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(64);  // 32 bytes * 2 characters per byte
        for (uint256 i = 0; i < 32; i++) {
            str[i*2] = alphabet[uint8(_bytes32[i] >> 4)];
            str[1 + i*2] = alphabet[uint8(_bytes32[i] & 0x0f)];
        }
        return string(str);
    }
}
