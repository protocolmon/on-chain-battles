// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../lib/RandomnessLibV1.sol";
import { IEventLoggerV1 } from "../interfaces/IEventLoggerV1.sol";

abstract contract GamePlayItem {
    /// @dev If we'd use OZ Ownable here we would need to pass owner to every constructor, not worth the extra code here
    address private deployer;
    IEventLoggerV1 internal logger;

    constructor() {
        deployer = msg.sender;
    }

    function isRandomHit(
        uint256 seed,
        string memory salt,
        uint8 chance
    ) internal pure returns (bool) {
        return RandomnessLibV1.isRandomHit(seed, salt, chance);
    }

    function setLogger(IEventLoggerV1 _logger) external {
        require(msg.sender == deployer, "GamePlayItem: Only deployer can set logger");
        logger = _logger;
    }
}
