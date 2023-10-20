// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./GamePlayItemV1.sol";
import "../lib/MoveLibV1.sol";
import "../interfaces/IMoveV1.sol";

abstract contract MoveV1 is GamePlayItem, IMoveV1 {}
