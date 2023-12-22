// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./abstract/BaseConfusedMove.sol";

contract ConfusedTimeoutMove is BaseConfusedMove {
    constructor(IMoveV1 _originalMove) BaseConfusedMove(_originalMove) {}
}
