// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

// OpenZeppelin
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";

// Interfaces (todo make this generic)
import {IElementalEchoesTokenUriProvider} from "./elemental-echoes/IElementalEchoesTokenUriProvider.sol";

// Structs
import {Monster, PackType, MonsterType, MonsterElement, Background, Rarity} from "./elemental-echoes/ElementalEchoesMonster.sol";

contract BoosterPacks is
    Initializable,
    ERC721AUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    event Purchase(
        address payer,
        address receiver, // receiver of the NFTs
        uint256 amount,
        uint256 price,
        uint256 protocolFee
    );

    event Sale(
        address seller,
        address receiver, // receiver of the funds
        uint256 amount,
        uint256 price,
        uint256 protocolFee
    );

    event NewEpochScheduled(uint256 timestamp);

    event FulfillEpochRevealed(uint256 timestamp, uint256 randomness);

    event RevealRequested(uint256 tokenId, uint256 nextRevealTimestamp);

    address payable public feeReceiver;
    IElementalEchoesTokenUriProvider public tokenUriProvider;

    mapping(uint256 => uint256) public tokenIdToEpoch;
    mapping(uint256 => uint256) public epochToRandomness;

    uint256 public PRICE;
    uint256 public FEE;
    uint256 public MAX_SUPPLY;

    uint256 public constant NEW_PRICE = 1 ether;
    uint256 public constant NEW_PRICE_START_TOKEN_ID = 387;

    /// @dev Actually unused decided to keep at 10k (lol)
    uint256 public constant NEW_MAX_SUPPLY = 100_000;

    function initialize(
        string memory args_name,
        string memory args_symbol,
        uint256 args_price,
        uint256 args_fee,
        uint256 args_maxSupply,
        address payable args_feeReceiver,
        IElementalEchoesTokenUriProvider args_tokenUriProvider
    ) public initializerERC721A initializer {
        __ERC721A_init(args_name, args_symbol);
        __Ownable_init(_msgSender());

        __ReentrancyGuard_init();

        feeReceiver = args_feeReceiver;
        tokenUriProvider = args_tokenUriProvider;

        PRICE = args_price;
        FEE = args_fee;
        MAX_SUPPLY = args_maxSupply;
    }

    /** buying */

    function buy(
        address to,
        uint256 quantity
    )
        external
        payable
        nonReentrant // since we send eth we go safe and use nonReentrant. @todo: check the extra gas
    {
        require(quantity > 0, "Quantity must be > 0");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Max supply reached");

        // get the price & check if enough value
        uint256 price = NEW_PRICE * quantity;
        require(msg.value >= price, "Value too low");

        // mint
        _mint(to, quantity);

        Address.sendValue(payable(msg.sender), msg.value - price);

        emit Purchase(msg.sender, to, quantity, price, 0);
    }

    /** selling */

    function sell(
        uint256[] memory tokenIds,
        address payable receiver
    )
        external
        nonReentrant // since we send eth we go safe and use nonReentrant. @todo: check the extra gas
    {
        require(tokenIds.length > 0, "Empty array of tokenIds");
        require(tokenIds.length < 256, "Too many tokenIds");

        // get the price and fees
        uint256 price = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            price += (
                tokenIds[i] >= NEW_PRICE_START_TOKEN_ID ? NEW_PRICE : PRICE
            );
        }
        uint256 protocolFee = (price * FEE) / (1 ether);

        // burn the NFTs from the minter
        _burnMultiple(tokenIds);

        // send out the fees
        Address.sendValue(feeReceiver, protocolFee);
        Address.sendValue(receiver, price - protocolFee);

        emit Sale(msg.sender, receiver, tokenIds.length, price, protocolFee);
    }

    /** reverse swapping */

    function reverseSwap(
        uint256 tokenId,
        address receiver
    ) external payable nonReentrant {
        require(msg.value == FEE, "Value too low");

        _burn(tokenId, true);
        Address.sendValue(feeReceiver, FEE);

        uint256 price = (
            tokenId >= NEW_PRICE_START_TOKEN_ID ? NEW_PRICE : PRICE
        );
        emit Sale(msg.sender, receiver, 1, price, FEE);

        _mint(receiver, 1);
        if (price > NEW_PRICE) {
            Address.sendValue(payable(msg.sender), price - NEW_PRICE);
        }
        emit Purchase(msg.sender, receiver, 1, price, 0);
    }

    function _burnMultiple(uint256[] memory ids) internal {
        for (uint256 i = 0; i < ids.length; i++) {
            _burn(ids[i], true);
        }
    }

    /** prices */

    function getBuyPriceInclFees(
        uint256 args_amount
    ) public view returns (uint256 price) {
        // no fee for buying
        price = NEW_PRICE * args_amount;
    }

    function getSellPriceInclFees(
        uint256 args_amount
    ) public view returns (uint256) {
        uint256 sellPrice = NEW_PRICE * args_amount;
        return sellPrice - (sellPrice * FEE) / (1 ether);
    }

    /********* ERC721 ************/

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_exists(tokenId), "Nonexistent token");

        if (_tokenIdToRandomness(tokenId) == 0) {
            return tokenUriProvider.tokenURI(tokenId);
        } else {
            return
                tokenUriProvider.tokenURI(
                    tokenId,
                    getMonsterByTokenId(tokenId)
                );
        }
    }

    /********* REVEAL ************/

    uint256 public timestampForNextReveal;
    function requestRevealForTokens(uint256[] memory tokenIds) external {
        // if there is no scheduled reveal, we schedule one and join it
        if (timestampForNextReveal == 0) {
            _scheduleRevealEpoch();
            for (uint256 i = 0; i < tokenIds.length; i++) {
                require(ownerOf(tokenIds[i]) == msg.sender, "Not owner");
                require(tokenIdToEpoch[tokenIds[i]] == 0, "Already revealed");
                _joinCurrentRevealEpoch(tokenIds[i]);
            }
            return;
        }

        // if there is a scheduled reveal in the past and its not fulfilled,
        // we fill it, schedule a new one, join it and return
        if (block.timestamp >= timestampForNextReveal) {
            _fulfillRevealEpoch();
            _scheduleRevealEpoch();
            for (uint256 i = 0; i < tokenIds.length; i++) {
                require(ownerOf(tokenIds[i]) == msg.sender, "Not owner");
                require(tokenIdToEpoch[tokenIds[i]] == 0, "Already revealed");
                _joinCurrentRevealEpoch(tokenIds[i]);
            }

            return;
        }

        // if there is a scheduled reveal in the future, we join it
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not owner");
            require(tokenIdToEpoch[tokenIds[i]] == 0, "Already revealed");
            _joinCurrentRevealEpoch(tokenIds[i]);
        }
    }

    function fulfillRevealEpoch() external {
        require(timestampForNextReveal != 0, "No reveal scheduled");
        require(block.timestamp >= timestampForNextReveal, "Not yet");
        _fulfillRevealEpoch();
    }

    function _fulfillRevealEpoch() internal {
        uint256 r = uint256(blockhash(block.number - 1)); // block.prevrandao
        epochToRandomness[timestampForNextReveal] = r;
        emit FulfillEpochRevealed(timestampForNextReveal, r);
        timestampForNextReveal = 0;
    }

    function _scheduleRevealEpoch() internal {
        timestampForNextReveal = _newRevealTimestamp();
        emit NewEpochScheduled(timestampForNextReveal);
    }

    function _joinCurrentRevealEpoch(uint256 tokenId) internal {
        require(timestampForNextReveal != 0, "No reveal scheduled");
        tokenIdToEpoch[tokenId] = timestampForNextReveal;
        emit RevealRequested(tokenId, tokenIdToEpoch[tokenId]);
    }

    function _newRevealTimestamp() internal view returns (uint256) {
        return block.timestamp + 5 minutes;
    }

    function tokenIdToRandomness(
        uint256 tokenId
    ) external view returns (uint256) {
        return _tokenIdToRandomness(tokenId);
    }

    function _tokenIdToRandomness(
        uint256 tokenId
    ) internal view returns (uint256) {
        if (tokenIdToEpoch[tokenId] == 0) {
            return 0;
        }
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        tokenId,
                        epochToRandomness[tokenIdToEpoch[tokenId]]
                    )
                )
            );
    }

    /********* MONSTER ************/

    function getMonsterByTokenId(
        uint256 tokenId
    ) public view returns (Monster memory) {
        require(_tokenIdToRandomness(tokenId) != 0, "Not revealed");
        return _getMonsterByRandomNumber(_tokenIdToRandomness(tokenId));
    }

    function _getMonsterByRandomNumber(
        uint256 randomness
    ) internal pure returns (Monster memory monster) {
        /// Some examples for Bit Operations:
        /// https://medium.com/@imolfar/bitwise-operations-and-bit-manipulation-in-solidity-ethereum-1751f3d2e216
        /// https://hiddentao.com/archives/2018/12/10/using-bitmaps-for-efficient-solidity-smart-contracts
        /// https://www.tutorialspoint.com/solidity/solidity_conversions.htm
        /// https://ethereum.stackexchange.com/questions/9868/casting-a-uint-to-a-smaller-uint

        monster = Monster({
            packType: _getPackType(uint16(randomness) % 1_000),
            monsterType: _getMonsterType(uint16(randomness >> 16) % 10_000),
            element: _getElement(uint64(randomness >> 32) % 10_000),
            rarity: Rarity.Common,
            background: Background.Base
        });

        monster.rarity = _getRarity(monster.monsterType);
    }

    function _getRarity(
        MonsterType monsterType
    ) internal pure returns (Rarity) {
        if (monsterType == MonsterType.Bull) {
            return Rarity.Common;
        } else if (monsterType == MonsterType.Bear) {
            return Rarity.Common;
        } else if (monsterType == MonsterType.Gorilla) {
            return Rarity.Common;
        } else if (monsterType == MonsterType.Boar) {
            return Rarity.Uncommon;
        } else if (monsterType == MonsterType.Lizard) {
            return Rarity.Uncommon;
        } else if (monsterType == MonsterType.Elephant) {
            return Rarity.Rare;
        } else if (monsterType == MonsterType.Whale) {
            return Rarity.Rare;
        } else if (monsterType == MonsterType.Lion) {
            return Rarity.VeryRare;
        } else if (monsterType == MonsterType.Fox) {
            return Rarity.VeryRare;
        } else if (monsterType == MonsterType.Turtle) {
            return Rarity.UltraRare;
        } else if (monsterType == MonsterType.Dragon) {
            // Adding the Dragon case
            return Rarity.Mythic;
        } else {
            revert("Invalid monster type");
        }
    }

    function _getPackType(
        uint16 randomNumber
    ) internal pure returns (PackType) {
        // currently only elemental echoes packs
        // todo extract this logic to different contract
        if (randomNumber < 250) {
            return PackType.ElementalEchoes;
        } else if (randomNumber < 500) {
            return PackType.ElementalEchoes;
        } else if (randomNumber < 750) {
            return PackType.ElementalEchoes;
        } else {
            return PackType.ElementalEchoes;
        }
    }

    function _getMonsterType(
        uint16 randomNumber
    ) internal pure returns (MonsterType) {
        if (randomNumber < 1667) {
            // 16.67%
            return MonsterType.Bull;
        } else if (randomNumber < 3334) {
            // 16.67%
            return MonsterType.Bear;
        } else if (randomNumber < 5000) {
            // 16.67%
            return MonsterType.Gorilla;
        } else if (randomNumber < 6100) {
            // 11.00%
            return MonsterType.Boar;
        } else if (randomNumber < 7200) {
            // 11.00%
            return MonsterType.Lizard;
        } else if (randomNumber < 7900) {
            // 7.00%
            return MonsterType.Elephant;
        } else if (randomNumber < 8600) {
            // 7.00%
            return MonsterType.Whale;
        } else if (randomNumber < 9100) {
            // 5.00%
            return MonsterType.Lion;
        } else if (randomNumber < 9600) {
            // 5.00%
            return MonsterType.Fox;
        } else if (randomNumber < 9900) {
            // 3.00%
            return MonsterType.Turtle;
        } else {
            // 1.00%
            return MonsterType.Dragon;
        }
    }

    function _getElement(
        uint64 randomNumber
    ) internal pure returns (MonsterElement) {
        if (randomNumber < 2667) {
            // Fire 26.67%
            return MonsterElement.Fire;
        } else if (randomNumber < 5334) {
            // Nature 26.67%
            return MonsterElement.Nature;
        } else if (randomNumber < 8001) {
            // Water 26.67%
            return MonsterElement.Water;
        } else if (randomNumber < 8668) {
            // Electric 6.67%
            return MonsterElement.Electric;
        } else if (randomNumber < 9335) {
            // Mental 6.67%
            return MonsterElement.Mental;
        } else {
            // Toxic 6.67%
            return MonsterElement.Toxic;
        }
    }

    /********* SETTERS ************/
    // @todo: setter for all variables

    function setTokenUriProvider(
        IElementalEchoesTokenUriProvider args_tokenUriProvider
    ) external onlyOwner {
        tokenUriProvider = args_tokenUriProvider;
    }

    function setFeeReceiver(
        address payable args_feeReceiver
    ) external onlyOwner {
        feeReceiver = args_feeReceiver;
    }

    function setFee(uint256 args_fee) external onlyOwner {
        FEE = args_fee;
    }

    /********* OTHER ************/
    function fee() external view returns (uint256) {
        return FEE;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Returns the starting token ID.
     * To change the starting token ID, please override this function.
     */
    function _startTokenId() internal view override returns (uint256) {
        return 1;
    }
}
