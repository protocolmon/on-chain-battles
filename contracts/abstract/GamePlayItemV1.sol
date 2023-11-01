// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../lib/RandomnessLibV1.sol";
import { IEventLoggerV1 } from "../interfaces/IEventLoggerV1.sol";

abstract contract GamePlayItem {
    IEventLoggerV1 internal logger;

    function isRandomHit(
        uint256 seed,
        string memory salt,
        uint8 chance
    ) internal pure returns (bool) {
        return RandomnessLibV1.isRandomHit(seed, salt, chance);
    }

    function setLogger(IEventLoggerV1 _logger) external {
        logger = _logger;
    }
}
