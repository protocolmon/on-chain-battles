// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

// this is actually all not implemented yet, just copied from a different repo (experimental monsters)
interface ITokenURIV1 {
    enum MonsterType {
        Base,
        Adorable,
        Fluffy,
        Asian,
        Chubby,
        Hydra,
        Micro,
        Air,
        Turbo,
        Cube
    }

    enum Color {
        Black,
        Blue,
        Gold,
        Green,
        Orange,
        Pink,
        Purple,
        Red,
        Silver,
        Turquoise,
        Yellow
    }

    enum Background {
        Anime,
        Cartoon
    }

    enum Effect {
        None,
        Glitter,
        Animated,
        SparkleMotion,
        SonicShimmer
    }

    function tokenURI(
        uint256 randomness,
        uint256 tokenId,
        uint8 series,
        uint8 edition,
        uint8 variant
    ) external view returns (string memory);

    function createMonster(
        uint256 randomness,
        uint256 tokenId,
        uint8 variant
    ) external view returns (Monster memory);

    struct Monster {
        string monsterType;
        string color;
        uint8 guidance;
        uint8 denoising;
        uint8 steps;
        uint8 hp;
        uint8 wind;
        uint8 fire;
        uint8 earth;
        uint8 water;
    }
}
