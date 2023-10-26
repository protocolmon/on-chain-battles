// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

interface IMonsterV1 {
    enum Element {
        None,
        Electric,
        Fire,
        Water,
        Mental,
        Nature,
        Toxic
    }

    struct Monster {
        uint256 tokenId;
        Element element;
        uint16 hp;
        uint16 attack;
        uint16 defense;
        uint16 speed;
        // @dev Main purpose of this field is to avoid heal move exceeding initial hp
        uint16 hpInitial;
        // @dev This can be removed later when using real nfts
        uint16 monsterType;
    }
}
