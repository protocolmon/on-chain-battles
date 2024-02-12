// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ILeaderboardV1} from "./interfaces/ILeaderboardV1.sol";

contract LeaderboardManagerV1 is Initializable, OwnableUpgradeable {
    mapping(uint256 => ILeaderboardV1) public leaderboards;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner) external initializer {
        __Ownable_init(owner);
    }

    function setLeaderboard(
        uint256 id,
        ILeaderboardV1 leaderboard
    ) external onlyOwner {
        leaderboards[id] = leaderboard;
    }
}
