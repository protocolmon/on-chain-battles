// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./GamePlayItemV1.sol";
import "../lib/MoveLibV1.sol";
import "./MoveV1.sol";

abstract contract MoveWithStorageV1 is GamePlayItem, MoveV1 {
    mapping(uint256 => uint16) internal store;
}
