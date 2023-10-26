// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./interfaces/IMonsterApiV1.sol";

contract MonsterApiV1 is IMonsterApiV1 {
    uint256 monsterCount;

    mapping(uint256 => IMonsterV1.Monster) private _monsters;

    event MonsterCreated(uint256 indexed tokenId);

    constructor() {}

    function createMonster(
        uint256 tokenId,
        IMonsterV1.Element element,
        uint16 hp,
        uint16 attack,
        uint16 defense,
        uint16 speed,
        Monster monster
    ) public {
        _monsters[tokenId] = IMonsterV1.Monster(
            tokenId,
            element,
            hp,
            attack,
            defense,
            speed,
            hp,
            uint16(monster)
        );

        emit MonsterCreated(tokenId);
    }

    function createMonsterByName(Monster monster) external returns (uint256) {
        IMonsterV1.Element element;
        uint16 hp = 100;
        uint16 attack = 100;
        uint16 defense = 100;
        uint16 speed = 100;

        if (
            monster == Monster.Blazehorn ||
            monster == Monster.Foretusk ||
            monster == Monster.Aquasteer
        ) {
            hp += 20;
            speed += 20;
            attack += 30;
            defense += 30;
        } else if (
            monster == Monster.Flampanda ||
            monster == Monster.Verdubear ||
            monster == Monster.Wavepaw
        ) {
            hp += 25;
            speed += 25;
            attack += 25;
            defense += 25;
        } else if (
            monster == Monster.Pyrilla ||
            monster == Monster.Florangutan ||
            monster == Monster.Tidalmonk
        ) {
            hp += 40;
            speed += 10;
            attack += 30;
            defense += 20;
        } else if (
            monster == Monster.Fernopig ||
            monster == Monster.Leafsnout ||
            monster == Monster.Streamhog
        ) {
            hp += 20;
            speed += 40;
            attack += 10;
            defense += 30;
        } else {
            revert("Unknown monster");
        }

        if (
            monster == Monster.Blazehorn ||
            monster == Monster.Flampanda ||
            monster == Monster.Pyrilla ||
            monster == Monster.Fernopig
        ) {
            element = IMonsterV1.Element.Fire;
        } else if (
            monster == Monster.Foretusk ||
            monster == Monster.Verdubear ||
            monster == Monster.Florangutan ||
            monster == Monster.Leafsnout
        ) {
            element = IMonsterV1.Element.Nature;
        } else if (
            monster == Monster.Aquasteer ||
            monster == Monster.Wavepaw ||
            monster == Monster.Tidalmonk ||
            monster == Monster.Streamhog
        ) {
            element = IMonsterV1.Element.Water;
        } else {
            revert("Unknown monster");
        }

        createMonster(++monsterCount, element, hp, attack, defense, speed, monster);

        return monsterCount;
    }

    function getMonster(
        uint256 tokenId
    ) external view returns (IMonsterV1.Monster memory) {
        return _monsters[tokenId];
    }
}
