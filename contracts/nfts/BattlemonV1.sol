// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

// OpenZeppelin
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

// ERC721A
import "erc721a-upgradeable/contracts/extensions/ERC721ABurnableUpgradeable.sol";

// Own Interfaces
import "./randomness/interfaces/IRandomnessV1.sol";
import "./randomness/interfaces/IRandomnessCallbackV1.sol";
import "./metadata/interfaces/IBattlemonMetadataV1.sol";
import "./allowlist/interfaces/IAllowlistV1.sol";

contract BattlemonV1 is ERC721ABurnableUpgradeable, OwnableUpgradeable, IRandomnessCallbackV1, ReentrancyGuardUpgradeable {
    using Strings for uint256;

    struct Edition {
        uint256 supply;
        uint256 maxSupply;
        uint256 price;
        address paymentReceiver;
        IBattlemonMetadataV1 metadata;
        IAllowlistV1 allowlist;
    }

    /****************************
     * VARIABLES *
     ***************************/

    /// @dev Our oracle
    IRandomnessV1 public randomness;

    /****************************
     * MAPPINGS *
     ***************************/

    /// @dev Storage of the random numbers
    mapping(uint256 => uint256) public tokenIdToRandom;

    /// @dev Mapping of edition IDs to editions
    mapping(uint24 => Edition) public editions;

    /****************************
     * EVENTS *
     ***************************/

    event RandomWordsFulfilled(
        uint256 indexed tokenId,
        uint256 indexed randomness
    );

    /****************************
     * CONSTRUCTOR *
     ***************************/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _randomness) public initializerERC721A initializer {
        __ERC721A_init("BattlemonV1", "BTLMON");
        __ERC721ABurnable_init();
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();

        randomness = IRandomnessV1(_randomness);
    }

    /// @dev amount = number of monsters to mint
    function mintTo(address to, uint24 editionId, uint256 amount) public payable nonReentrant {
        /** CHECKS */
        require(amount > 0, "BattlemonV1: Zero amount");
        require(to != address(0), "BattlemonV1: Zero address");

        Edition storage edition = editions[editionId];
        require(edition.maxSupply > 0, "BattlemonV1: No supply");
        require(edition.supply + amount <= edition.maxSupply, "BattlemonV1: Max supply reached");
        require(msg.value == edition.price * amount, "BattlemonV1: Wrong payment");

        (bool isAllowed, bool hasCallback) = edition.allowlist.isAllowed(msg.sender);
        if (address(edition.allowlist) != address(0)) {
            require(isAllowed, "BattlemonV1: Not allowed");
        }

        /** EFFECTS */
        uint256 startId = _nextTokenId();
        uint256[] memory tokenIds = new uint256[](amount);

        // @dev: yep, could be handled more efficient, but gas is cheap on nova
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = startId + i;
            tokenIds[i] = tokenId;
        }

        edition.supply += amount;

        // we request the random numbers from the randomness oracle
        randomness.requestRandomWords(
            IRandomnessV1.RequestType.Monsters,
            tokenIds,
            this
        );

        _mint(to, amount);
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId();
    }

    /******************************
     * PUBLIC VIEW FUNCTIONS *
     ***************************/

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function getMonster(
        uint256 tokenId
    ) public view returns (IBattlemonMetadataV1.Monster memory) {
        require(_exists(tokenId), "BattlemonV1: Token does not exist");
        require(
            tokenIdToRandom[tokenId] != 0,
            "BattlemonV1: Randomness not set"
        );

        uint24 edition = _ownershipOf(tokenId).extraData;
        return editions[edition].metadata.getMonster(tokenId, tokenIdToRandom[tokenId]);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721AUpgradeable, IERC721AUpgradeable) returns (string memory) {
        require(_exists(tokenId), "BattlemonV1: Token does not exist");
        require(
            tokenIdToRandom[tokenId] != 0,
            "BattlemonV1: Randomness not set"
        );

        uint24 edition = _ownershipOf(tokenId).extraData;
        return editions[edition].metadata.tokenURI(tokenId, tokenIdToRandom[tokenId]);
    }

    /***************************
     * ERC721A Overrides *
     **************************/

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    /// @dev Keep extra data on transfer
    function _extraData(
        address,
        address,
        uint24 previousExtraData
    ) internal pure override returns (uint24) {
        return previousExtraData;
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
            tokenIdToRandom[tokenId] = randomWords[i];

            emit RandomWordsFulfilled(tokenId, randomWords[i]);
        }
    }

    /****************************
     * ADMIN FUNCTIONS *
     ***************************/

    function addEdition(
        uint24 editionId,
        uint256 maxSupply,
        uint256 price,
        address paymentReceiver,
        IBattlemonMetadataV1 metadata,
        IAllowlistV1 allowlist
    ) external onlyOwner {
        require(editions[editionId].maxSupply == 0, "Edition already exists");

        editions[editionId] = Edition({
            supply: 0,
            maxSupply: maxSupply,
            price: price,
            paymentReceiver: paymentReceiver,
            metadata: metadata,
            allowlist: allowlist
        });
    }

    function updateEdition(
        uint24 editionId,
        uint256 maxSupply,
        uint256 price,
        address paymentReceiver,
        IBattlemonMetadataV1 metadata,
        IAllowlistV1 allowlist
    ) external onlyOwner {
        require(editions[editionId].maxSupply > 0, "Edition does not exist");

        editions[editionId].maxSupply = maxSupply;
        editions[editionId].price = price;
        editions[editionId].paymentReceiver = paymentReceiver;
        editions[editionId].metadata = metadata;
        editions[editionId].allowlist = allowlist;
    }

    function withdraw(address payable to) external onlyOwner {
        to.transfer(address(this).balance);
    }

    function setRandomness(address _randomness) external onlyOwner {
        randomness = IRandomnessV1(_randomness);
    }

    /****************************
     * FALLBACK FUNCTION *
     ***************************/

    receive() external payable {
        revert("Nope");
    }
}
