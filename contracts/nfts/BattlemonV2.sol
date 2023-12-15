// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

import "./randomness/interfaces/IRandomnessV1.sol";
import "./metadata/interfaces/IBattlemonMetadataV1.sol";
import "./allowlist/interfaces/IAllowlistV1.sol";
import "./randomness/interfaces/IRandomnessCallbackV1.sol";

contract BattlemonV2 is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ERC721URIStorageUpgradeable,
    ERC721BurnableUpgradeable,
    AccessControlUpgradeable,
    EIP712Upgradeable,
    ERC721VotesUpgradeable,
    ReentrancyGuardUpgradeable,
    IRandomnessCallbackV1
{
    struct Edition {
        uint256 supply;
        uint256 maxSupply;
        uint256 price;
        address paymentReceiver;
        IBattlemonMetadataV1 metadata;
        IAllowlistV1 allowlist;
    }

    struct TokenInfo {
        uint256 mintDate;
        uint256 randomness;
        uint256 editionId;
    }

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /****************************
     * VARIABLES *
     ***************************/

    /// @dev Our oracle
    IRandomnessV1 public randomness;

    uint256 private _nextTokenId;

    /****************************
     * MAPPINGS *
     ***************************/

    /// @dev Storage of the random numbers, mint date, etc.
    mapping(uint256 => TokenInfo) public tokenInfo;

    /// @dev Mapping of edition IDs to editions
    mapping(uint24 => Edition) public editions;

    /****************************
     * EVENTS *
     ***************************/

    event RandomWordsFulfilled(
        uint256 indexed tokenId,
        uint256 indexed randomness
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address defaultAdmin,
        address minter
    ) public initializer {
        __ERC721_init("BattlemonV1", "BTLMON");
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __ERC721Burnable_init();
        __AccessControl_init();
        __EIP712_init("BattlemonV1", "1");
        __ERC721Votes_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);

        /// @dev we start at token 1
        _nextTokenId = 1;
    }

    /// @dev amount = number of monsters to mint
    function mintTo(
        address to,
        uint24 editionId,
        uint256 amount
    ) public payable nonReentrant {
        /** CHECKS */
        require(amount > 0, "BattlemonV1: Zero amount");
        require(to != address(0), "BattlemonV1: Zero address");

        Edition storage edition = editions[editionId];
        require(edition.maxSupply > 0, "BattlemonV1: No supply");
        require(
            edition.supply + amount <= edition.maxSupply,
            "BattlemonV1: Max supply reached"
        );
        require(
            msg.value == edition.price * amount,
            "BattlemonV1: Wrong payment"
        );

        (bool isAllowed, bool hasCallback) = edition.allowlist.isAllowed(
            msg.sender
        );
        if (address(edition.allowlist) != address(0)) {
            require(isAllowed, "BattlemonV1: Not allowed");
        }

        /** EFFECTS */
        uint256[] memory tokenIds = new uint256[](amount);

        // @dev: yep, could be handled more efficient, but gas is cheap on nova
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            _safeMint(to, tokenId);
        }

        edition.supply += amount;

        // we request the random numbers from the randomness oracle
        randomness.requestRandomWords(
            IRandomnessV1.RequestType.Monsters,
            tokenIds,
            this
        );
    }

    /****************************
     * ORACLE FUNCTIONS *
     ***************************/

    function fulfillRandomWords(
        uint256[] memory tokenIds,
        uint256[] memory randomWords
    ) external override {
        require(msg.sender == address(randomness), "BondimonV1: Only oracle");
        require(
            tokenIds.length == randomWords.length,
            "BondimonV1: Wrong length"
        );

        for (uint256 i = 0; i < randomWords.length; i++) {
            uint256 tokenId = tokenIds[i];
            tokenInfo[tokenId].randomness = randomWords[i];

            emit RandomWordsFulfilled(tokenId, randomWords[i]);
        }
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address to,
        uint256 tokenId,
        address auth
    )
        internal
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            ERC721VotesUpgradeable
        )
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    )
        internal
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            ERC721VotesUpgradeable
        )
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            ERC721URIStorageUpgradeable,
            AccessControlUpgradeable
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
