// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ILeaderboardV2} from "./interfaces/ILeaderboardV2.sol";

contract LeaderboardManagerV2 is Initializable, OwnableUpgradeable {
    ILeaderboardV2 public activeLeaderboard;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner) external initializer {
        __Ownable_init(owner);
    }

    function setActiveLeaderboard(
        ILeaderboardV2 newActiveLeaderboard
    ) external onlyOwner {
        activeLeaderboard = newActiveLeaderboard;
    }
}
