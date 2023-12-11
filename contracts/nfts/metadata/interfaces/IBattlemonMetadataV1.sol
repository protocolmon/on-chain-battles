// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

// this is actually all not implemented yet, just copied from a different repo (experimental monsters)
interface IBattlemonMetadataV1 {
    struct HonoraryInfo {
        bool isHonorary;
        string name;
        string imageUri;
    }

    struct Monster {
        uint8 name;
        uint8 color;
        uint8 background;
        uint8 effect;
        uint8 rarity;
        bool isHonorary;
    }

    enum Rarity {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary,
        Mythic,
        Honorary
    }

    function getMonster(
        uint256 tokenId,
        uint256 randomness
    ) external view returns (Monster memory);

    function tokenURI(
        uint256 tokenId,
        uint256 randomness
    ) external view returns (string memory);
}
