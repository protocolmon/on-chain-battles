// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/ILeaderboardV1.sol";

contract LeaderboardV1 is Initializable, OwnableUpgradeable, ILeaderboardV1 {
    struct PlayerStats {
        uint256 wins;
        uint256 losses;
        uint256 escapes;
    }

    address public matchMaker;

    /// @dev Player points by address
    mapping(address => PlayerStats) public playerStats;

    /// @dev List of all players
    address[] public playerList;

    modifier onlyMatchMaker() {
        require(msg.sender == matchMaker, "LeaderboardV1: Only match maker");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _matchMaker) external initializer {
        __Ownable_init(msg.sender);

        matchMaker = _matchMaker;
    }

    function addEscape(address player) external override onlyMatchMaker {
        _addPlayer(player);
        playerStats[player].escapes++;
    }

    function addWin(address player) external override onlyMatchMaker {
        _addPlayer(player);
        playerStats[player].wins++;
    }

    function addLoss(address player) external override onlyMatchMaker {
        _addPlayer(player);
        playerStats[player].losses++;
    }

    /// @dev Return the first 100 stats after offset (return the PlayerStats)
    function getAllStats(
        uint256 offset
    ) external view returns (PlayerStats[] memory) {
        uint256 length = playerList.length;
        uint256 maxLength = offset + 100;
        if (maxLength > length) {
            maxLength = length;
        }

        PlayerStats[] memory stats = new PlayerStats[](maxLength - offset);
        for (uint256 i = offset; i < maxLength; i++) {
            stats[i - offset] = playerStats[playerList[i]];
        }
        return stats;
    }

    function getPlayerCount() external view returns (uint256) {
        return playerList.length;
    }

    function _addPlayer(address player) internal {
        if (
            playerStats[player].wins == 0 &&
            playerStats[player].losses == 0 &&
            playerStats[player].escapes == 0
        ) {
            playerList.push(player);
        }
    }
}
