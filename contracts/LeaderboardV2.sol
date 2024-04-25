// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IUsernamesV1.sol";
import "./interfaces/ILeaderboardV2.sol";

contract LeaderboardV2 is Initializable, OwnableUpgradeable, ILeaderboardV2 {
    struct PlayerStats {
        uint256 wins;
        uint256 losses;
        uint256 escapes;
    }

    struct PlayerStatsView {
        PlayerStats stats;
        address player;
        string username;
    }

    uint256 public validUntil;

    address public matchMaker;

    IUsernamesV1 public usernames;

    string public eventName;

    /// @dev Player points by address
    mapping(address => PlayerStats) public playerStats;

    /// @dev List of all players
    address[] public playerList;

    modifier onlyMatchMaker() {
        require(msg.sender == matchMaker, "LeaderboardV2: Only match maker");
        _;
    }

    modifier onlyWhenValid() {
        require(
            block.timestamp < validUntil,
            "LeaderboardV2: Can't change contract state after valid period"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _matchMaker,
        IUsernamesV1 _usernames,
        uint256 _validUntil,
        string calldata _eventName
    ) external initializer {
        __Ownable_init(msg.sender);

        matchMaker = _matchMaker;
        usernames = _usernames;
        validUntil = _validUntil;
        eventName = _eventName;
    }

    function setMatchMaker(
        address _matchMaker
    ) external onlyOwner onlyWhenValid {
        matchMaker = _matchMaker;
    }

    function setUsernames(
        IUsernamesV1 _usernames
    ) external onlyOwner onlyWhenValid {
        usernames = _usernames;
    }

    function setValidUntil(
        uint256 _validUntil
    ) external onlyOwner onlyWhenValid {
        validUntil = _validUntil;
    }

    function setEventName(
        string calldata _eventName
    ) external onlyOwner onlyWhenValid {
        eventName = _eventName;
    }

    function getPlayerCount() external view returns (uint256) {
        return playerList.length;
    }

    /// @dev Return the first 100 stats after offset (return the PlayerStats)
    function getAllStats(
        uint256 offset
    ) external view returns (PlayerStatsView[] memory) {
        uint256 length = playerList.length;
        uint256 maxLength = offset + 100;
        if (maxLength > length) {
            maxLength = length;
        }

        PlayerStatsView[] memory statsViews = new PlayerStatsView[](
            maxLength - offset
        );
        address[] memory addresses = new address[](maxLength - offset);
        for (uint256 i = offset; i < maxLength; i++) {
            addresses[i - offset] = playerList[i];
        }

        string[] memory names = usernames.getNames(addresses);

        for (uint256 i = 0; i < addresses.length; i++) {
            statsViews[i].stats = playerStats[addresses[i]];
            statsViews[i].player = addresses[i];
            statsViews[i].username = names[i];
        }
        return statsViews;
    }

    function addEscape(
        address player
    ) external override onlyMatchMaker onlyWhenValid {
        _addPlayer(player);
        playerStats[player].escapes++;
    }

    function addWin(
        address player
    ) external override onlyMatchMaker onlyWhenValid {
        _addPlayer(player);
        playerStats[player].wins++;
    }

    function addLoss(
        address player
    ) external override onlyMatchMaker onlyWhenValid {
        _addPlayer(player);
        playerStats[player].losses++;
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
