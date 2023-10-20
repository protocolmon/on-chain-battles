// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

library MathLibV1 {
    function sub(uint16 a, uint16 b) internal pure returns (uint16) {
        if (b > a) {
            return 0;
        }
        return a - b;
    }

    function sub(uint16 a, int16 b) internal pure returns (uint16) {
        if (b < 0) {
            uint16 positiveB = uint16(-b);
            if (a + positiveB < a) {
                // overflow check
                return type(uint16).max; // return the maximum value for uint16
            }
            return a + positiveB;
        } else {
            return sub(a, uint16(b)); // reusing the first function
        }
    }
}
