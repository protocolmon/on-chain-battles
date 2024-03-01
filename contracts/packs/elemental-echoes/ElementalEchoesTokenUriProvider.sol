// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {IElementalEchoesTokenUriProvider} from "./IElementalEchoesTokenUriProvider.sol";

import {Monster, PackType, MonsterType, MonsterElement, Background, Rarity} from "./ElementalEchoesMonster.sol";

contract ElementalEchoesTokenUriProvider is
    IElementalEchoesTokenUriProvider,
    Ownable
{
    using Strings for uint256;

    uint256 public constant NUM_OF_TYPES = 4;

    string public imageBaseUri;
    string public packIpfsHash;

    constructor(
        string memory _imageBaseUri,
        string memory _packIpfsHash
    ) Ownable(msg.sender) {
        imageBaseUri = _imageBaseUri;
        packIpfsHash = _packIpfsHash;
    }

    /********* Packs ***********/

    // the tokenURI method for Packs
    function tokenURI(
        uint256 tokenId
    ) external view override returns (string memory) {
        string memory attributes = string(
            abi.encodePacked(
                "[",
                '{"trait_type":"Type", "value":"',
                Strings.toString(_getPackType(tokenId)),
                '"},',
                '{"trait_type":"Name", "value":"',
                _getPackName(tokenId),
                '"}',
                "]"
            )
        );

        // Building the JSON metadata string without animationUrl
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"',
                        _getPackName(tokenId),
                        '", "image":"',
                        _getImageUrl(tokenId),
                        '", "description":"',
                        _getPackDescription(tokenId),
                        '", "attributes":',
                        attributes,
                        "}"
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _getPackType(uint256 tokenId) internal pure returns (uint256) {
        return 0;
    }

    function _getPackName(
        uint256 tokenId
    ) internal pure returns (string memory) {
        uint256 packType = _getPackType(tokenId);

        if (packType == 0) {
            return "Elemental Echoes";
        } else {
            revert("Invalid pack type");
        }
    }

    function _getImageUrl(
        uint256 tokenId
    ) internal view returns (string memory) {
        uint256 packType = _getPackType(tokenId);
        string memory imagePath;

        if (packType == 0) {
            imagePath = packIpfsHash;
        } else {
            revert("Invalid pack type");
        }

        return string(abi.encodePacked(imageBaseUri, imagePath));
    }

    function _getPackDescription(
        uint256 tokenId
    ) internal pure returns (string memory) {
        uint256 packType = _getPackType(tokenId);

        if (packType == 0) {
            return "Description tbd";
        } else {
            revert("Invalid pack type");
        }
    }

    /********* Packs ***********/

    // the tokenURI method for revealed Monsters
    function tokenURI(
        uint256 tokenId,
        Monster memory monster
    ) external view returns (string memory) {
        string memory image = _getImageUrlMonster(monster);

        // Building the JSON metadata string
        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name":"',
                    _monsterName(monster.element, monster.monsterType),
                    '", ',
                    '"image":"',
                    image,
                    uint256(monster.monsterType).toString(),
                    "-",
                    uint256(monster.element).toString(),
                    '.jpg", "attributes":',
                    _getAttributesJson(monster),
                    "}"
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _getAttributesJson(
        Monster memory monster
    ) internal view returns (string memory) {
        // Concatenate attributes into a JSON string
        return
            string(
                abi.encodePacked(
                    "[",
                    '{"trait_type":"Type", "value":"',
                    _monsterTypeString(monster.monsterType),
                    '"},',
                    '{"trait_type":"Element", "value":"',
                    _elementString(monster.element),
                    '"},',
                    '{"trait_type":"Background", "value":"',
                    _backgroundString(monster.packType),
                    '"},',
                    '{"trait_type":"Rarity", "value":"',
                    _rarityString(monster.rarity),
                    '"}',
                    "]"
                )
            );
    }

    function _rarityString(
        Rarity rarity
    ) internal pure returns (string memory) {
        if (rarity == Rarity.Common) {
            return "Common";
        } else if (rarity == Rarity.Uncommon) {
            return "Uncommon";
        } else if (rarity == Rarity.Rare) {
            return "Rare";
        } else if (rarity == Rarity.VeryRare) {
            return "Very Rare";
        } else if (rarity == Rarity.UltraRare) {
            return "Ultra Rare";
        } else if (rarity == Rarity.Mythic) {
            return "Mythic";
        } else {
            revert("Invalid rarity");
        }
    }

    function _monsterTypeString(
        MonsterType monsterType
    ) internal pure returns (string memory) {
        if (monsterType == MonsterType.Bull) {
            return "Bull";
        } else if (monsterType == MonsterType.Bear) {
            return "Bear";
        } else if (monsterType == MonsterType.Gorilla) {
            return "Gorilla";
        } else if (monsterType == MonsterType.Boar) {
            return "Boar";
        } else if (monsterType == MonsterType.Lizard) {
            return "Lizard";
        } else if (monsterType == MonsterType.Elephant) {
            return "Elephant";
        } else if (monsterType == MonsterType.Whale) {
            return "Whale";
        } else if (monsterType == MonsterType.Lion) {
            return "Lion";
        } else if (monsterType == MonsterType.Fox) {
            return "Fox";
        } else if (monsterType == MonsterType.Turtle) {
            return "Turtle";
        } else if (monsterType == MonsterType.Dragon) {
            return "Dragon";
        } else {
            revert("Invalid monster type");
        }
    }

    function _elementString(
        MonsterElement element
    ) internal pure returns (string memory) {
        if (element == MonsterElement.Fire) {
            return "Fire";
        } else if (element == MonsterElement.Nature) {
            return "Nature";
        } else if (element == MonsterElement.Water) {
            return "Water";
        } else if (element == MonsterElement.Electric) {
            return "Electric";
        } else if (element == MonsterElement.Mental) {
            return "Mental";
        } else if (element == MonsterElement.Toxic) {
            return "Toxic";
        } else {
            revert("Invalid element");
        }
    }

    function _backgroundString(
        PackType packType
    ) internal pure returns (string memory) {
        // todo - implement proper backgrounds
        if (packType == PackType.ElementalEchoes) {
            return "Elemental Echoes";
        } else {
            revert("Invalid pack type");
        }
    }

    function _monsterName(
        MonsterElement element,
        MonsterType monster
    ) public pure returns (string memory) {
        if (element == MonsterElement.Fire) {
            if (monster == MonsterType.Bull) {
                return "Blazehorn";
            } else if (monster == MonsterType.Bear) {
                return "Flampanda";
            } else if (monster == MonsterType.Gorilla) {
                return "Pyrilla";
            } else if (monster == MonsterType.Boar) {
                return "Fernopig";
            } else if (monster == MonsterType.Lizard) {
                return "Firizard";
            } else if (monster == MonsterType.Elephant) {
                return "Magmaphant";
            } else if (monster == MonsterType.Whale) {
                return "Flarejaw";
            } else if (monster == MonsterType.Lion) {
                return "Flamlion";
            } else if (monster == MonsterType.Fox) {
                return "Emberfuzz";
            } else if (monster == MonsterType.Turtle) {
                return "Cinderplate";
            } else if (monster == MonsterType.Dragon) {
                return "Magmalore";
            }
        } else if (element == MonsterElement.Nature) {
            if (monster == MonsterType.Bull) {
                return "Foretusk";
            } else if (monster == MonsterType.Bear) {
                return "Verdubear";
            } else if (monster == MonsterType.Gorilla) {
                return "Florangutan";
            } else if (monster == MonsterType.Boar) {
                return "Leafsnout";
            } else if (monster == MonsterType.Lizard) {
                return "Floralon";
            } else if (monster == MonsterType.Elephant) {
                return "Grovemaw";
            } else if (monster == MonsterType.Whale) {
                return "Verdantide";
            } else if (monster == MonsterType.Lion) {
                return "Greenwhelp";
            } else if (monster == MonsterType.Fox) {
                return "Vineroot";
            } else if (monster == MonsterType.Turtle) {
                return "Terraform";
            } else if (monster == MonsterType.Dragon) {
                return "Djungalore";
            }
        } else if (element == MonsterElement.Water) {
            if (monster == MonsterType.Bull) {
                return "Aquasteer";
            } else if (monster == MonsterType.Bear) {
                return "Wavepaw";
            } else if (monster == MonsterType.Gorilla) {
                return "Tidalmonk";
            } else if (monster == MonsterType.Boar) {
                return "Streamhog";
            } else if (monster == MonsterType.Lizard) {
                return "Reptide";
            } else if (monster == MonsterType.Elephant) {
                return "Aquarump";
            } else if (monster == MonsterType.Whale) {
                return "Bubblestream";
            } else if (monster == MonsterType.Lion) {
                return "Ripplemane";
            } else if (monster == MonsterType.Fox) {
                return "Bublifox";
            } else if (monster == MonsterType.Turtle) {
                return "Hydroshell";
            } else if (monster == MonsterType.Dragon) {
                return "Tsunalore";
            }
        } else if (element == MonsterElement.Electric) {
            if (monster == MonsterType.Bull) {
                return "Thunderhoof";
            } else if (monster == MonsterType.Bear) {
                return "Shockfur";
            } else if (monster == MonsterType.Gorilla) {
                return "Electrang";
            } else if (monster == MonsterType.Boar) {
                return "Zappig";
            } else if (monster == MonsterType.Lizard) {
                return "Chargecrest";
            } else if (monster == MonsterType.Elephant) {
                return "Voltusk";
            } else if (monster == MonsterType.Whale) {
                return "Sparkfin";
            } else if (monster == MonsterType.Lion) {
                return "Voltmane";
            } else if (monster == MonsterType.Fox) {
                return "Zaptuft";
            } else if (monster == MonsterType.Turtle) {
                return "Zappadome";
            } else if (monster == MonsterType.Dragon) {
                return "Shocklore";
            }
        } else if (element == MonsterElement.Mental) {
            if (monster == MonsterType.Bull) {
                return "Psyhorn";
            } else if (monster == MonsterType.Bear) {
                return "Dreamgrowl";
            } else if (monster == MonsterType.Gorilla) {
                return "Cerebrilla";
            } else if (monster == MonsterType.Boar) {
                return "Enighog";
            } else if (monster == MonsterType.Lizard) {
                return "Cogniscale";
            } else if (monster == MonsterType.Elephant) {
                return "Mentolox";
            } else if (monster == MonsterType.Whale) {
                return "Psycheleap";
            } else if (monster == MonsterType.Lion) {
                return "Cerebropaw";
            } else if (monster == MonsterType.Fox) {
                return "Psygleam";
            } else if (monster == MonsterType.Turtle) {
                return "Mindshell";
            } else if (monster == MonsterType.Dragon) {
                return "Mentalore";
            }
        } else if (element == MonsterElement.Toxic) {
            if (monster == MonsterType.Bull) {
                return "Toxicorn";
            } else if (monster == MonsterType.Bear) {
                return "Poisonclaw";
            } else if (monster == MonsterType.Gorilla) {
                return "Gloomgrip";
            } else if (monster == MonsterType.Boar) {
                return "Fumebrow";
            } else if (monster == MonsterType.Lizard) {
                return "Acidtongue";
            } else if (monster == MonsterType.Elephant) {
                return "Sludgetrunk";
            } else if (monster == MonsterType.Whale) {
                return "Slimefin";
            } else if (monster == MonsterType.Lion) {
                return "Venomroar";
            } else if (monster == MonsterType.Fox) {
                return "Sludgeprowl";
            } else if (monster == MonsterType.Turtle) {
                return "Pestiplate";
            } else if (monster == MonsterType.Dragon) {
                return "Sporelore";
            }
        } else {
            revert("Invalid element");
        }

        // If no match is found
        revert("Invalid combination of element and monster type");
    }

    function _getImageUrlMonster(
        Monster memory monster
    ) internal view returns (string memory) {
        string memory imagePath = string(
            abi.encodePacked(
                uint256(monster.monsterType).toString(),
                "-",
                uint256(monster.element).toString(),
                ".jpg"
            )
        );

        return string(abi.encodePacked(imageBaseUri, imagePath));
    }

    /********* SETTER ************/

    function setImageBaseUri(string memory _uri) external onlyOwner {
        imageBaseUri = _uri;
    }
}
