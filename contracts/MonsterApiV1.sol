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
            monster == Monster.Aquasteer ||
            monster == Monster.Thunderhoof ||
            monster == Monster.Psyhorn ||
            monster == Monster.Toxicorn
        ) {
            hp += 20;
            speed += 20;
            attack += 30;
            defense += 30;
        } else if (
            monster == Monster.Flampanda ||
            monster == Monster.Verdubear ||
            monster == Monster.Wavepaw ||
            monster == Monster.Shockfur ||
            monster == Monster.Dreamgrowl ||
            monster == Monster.Poisonclaw
        ) {
            hp += 25;
            speed += 25;
            attack += 25;
            defense += 25;
        } else if (
            monster == Monster.Pyrilla ||
            monster == Monster.Florangutan ||
            monster == Monster.Tidalmonk ||
            monster == Monster.Electrang ||
            monster == Monster.Cerebrilla ||
            monster == Monster.Gloomgrip
        ) {
            hp += 40;
            speed += 10;
            attack += 30;
            defense += 20;
        } else if (
            monster == Monster.Fernopig ||
            monster == Monster.Leafsnout ||
            monster == Monster.Streamhog ||
            monster == Monster.Zappig ||
            monster == Monster.Enighog ||
            monster == Monster.Fumebrow
        ) {
            hp += 20;
            speed += 40;
            attack += 10;
            defense += 30;
        } else if (
            monster == Monster.Firizard ||
            monster == Monster.Floralon ||
            monster == Monster.Reptide ||
            monster == Monster.Chargecrest ||
            monster == Monster.Cogniscale ||
            monster == Monster.Acidtongue
        ) {
            hp += 20;
            speed += 30;
            attack += 20;
            defense += 30;
        } else if (
            monster == Monster.Magmaphant ||
            monster == Monster.Grovemaw ||
            monster == Monster.Aquarump ||
            monster == Monster.Voltusk ||
            monster == Monster.Mentolox ||
            monster == Monster.Sludgetrunk
        ) {
            hp += 30;
            speed += 10;
            attack += 30;
            defense += 30;
        } else if (
            monster == Monster.Flarejaw ||
            monster == Monster.Verdantide ||
            monster == Monster.Bubblestream ||
            monster == Monster.Sparkfin ||
            monster == Monster.Psycheleap ||
            monster == Monster.Slimefin
        ) {
            hp += 40;
            speed += 10;
            attack += 10;
            defense += 40;
        } else if (
            monster == Monster.Flamlion ||
            monster == Monster.Greenwhelp ||
            monster == Monster.Ripplemane ||
            monster == Monster.Voltmane ||
            monster == Monster.Cerebropaw ||
            monster == Monster.Venomroar
        ) {
            hp += 20;
            speed += 40;
            attack += 20;
            defense += 20;
        } else if (
            monster == Monster.Emberfuzz ||
            monster == Monster.Vineroot ||
            monster == Monster.Bublifox ||
            monster == Monster.Zaptuft ||
            monster == Monster.Psygleam ||
            monster == Monster.Sludgeprowl
        ) {
            hp += 10;
            speed += 40;
            attack += 40;
            defense += 10;
        } else if (
            monster == Monster.Cinderplate ||
            monster == Monster.Terraform ||
            monster == Monster.Hydroshell ||
            monster == Monster.Zappadome ||
            monster == Monster.Mindshell ||
            monster == Monster.Pestiplate
        ) {
            hp += 30;
            speed += 10;
            attack += 10;
            defense += 50;
        } else if (
            monster == Monster.Magmalore ||
            monster == Monster.Djungalore ||
            monster == Monster.Tsunalore ||
            monster == Monster.Shocklore ||
            monster == Monster.Mentalore ||
            monster == Monster.Sporelore
        ) {
            hp += 20;
            speed += 20;
            attack += 40;
            defense += 20;
        } else {
            revert("Unknown monster");
        }

        if (
            monster == Monster.Blazehorn ||
            monster == Monster.Flampanda ||
            monster == Monster.Pyrilla ||
            monster == Monster.Fernopig ||
            monster == Monster.Firizard ||
            monster == Monster.Magmaphant ||
            monster == Monster.Flarejaw ||
            monster == Monster.Flamlion ||
            monster == Monster.Emberfuzz ||
            monster == Monster.Cinderplate ||
            monster == Monster.Magmalore
        ) {
            element = IMonsterV1.Element.Fire;
        } else if (
            monster == Monster.Foretusk ||
            monster == Monster.Verdubear ||
            monster == Monster.Florangutan ||
            monster == Monster.Leafsnout ||
            monster == Monster.Floralon ||
            monster == Monster.Grovemaw ||
            monster == Monster.Verdantide ||
            monster == Monster.Greenwhelp ||
            monster == Monster.Vineroot ||
            monster == Monster.Terraform ||
            monster == Monster.Djungalore
        ) {
            element = IMonsterV1.Element.Nature;
        } else if (
            monster == Monster.Aquasteer ||
            monster == Monster.Wavepaw ||
            monster == Monster.Tidalmonk ||
            monster == Monster.Streamhog ||
            monster == Monster.Reptide ||
            monster == Monster.Aquarump ||
            monster == Monster.Bubblestream ||
            monster == Monster.Ripplemane ||
            monster == Monster.Bublifox ||
            monster == Monster.Hydroshell ||
            monster == Monster.Tsunalore
        ) {
            element = IMonsterV1.Element.Water;
        } else if (
            monster == Monster.Thunderhoof ||
            monster == Monster.Shockfur ||
            monster == Monster.Electrang ||
            monster == Monster.Zappig ||
            monster == Monster.Chargecrest ||
            monster == Monster.Voltusk ||
            monster == Monster.Sparkfin ||
            monster == Monster.Voltmane ||
            monster == Monster.Zaptuft ||
            monster == Monster.Zappadome ||
            monster == Monster.Shocklore
        ) {
            element = IMonsterV1.Element.Electric;
        } else if (
            monster == Monster.Psyhorn ||
            monster == Monster.Dreamgrowl ||
            monster == Monster.Cerebrilla ||
            monster == Monster.Enighog ||
            monster == Monster.Cogniscale ||
            monster == Monster.Mentolox ||
            monster == Monster.Psycheleap ||
            monster == Monster.Cerebropaw ||
            monster == Monster.Psygleam ||
            monster == Monster.Mindshell ||
            monster == Monster.Mentalore
        ) {
            element = IMonsterV1.Element.Mental;
        } else if (
            monster == Monster.Toxicorn ||
            monster == Monster.Poisonclaw ||
            monster == Monster.Gloomgrip ||
            monster == Monster.Fumebrow ||
            monster == Monster.Acidtongue ||
            monster == Monster.Sludgetrunk ||
            monster == Monster.Slimefin ||
            monster == Monster.Venomroar ||
            monster == Monster.Sludgeprowl ||
            monster == Monster.Pestiplate ||
            monster == Monster.Sporelore
        ) {
            element = IMonsterV1.Element.Toxic;
        } else {
            revert("Unknown monster");
        }

        createMonster(
            ++monsterCount,
            element,
            hp,
            attack,
            defense,
            speed,
            monster
        );

        return monsterCount;
    }

    function getMonster(
        uint256 tokenId
    ) external view returns (IMonsterV1.Monster memory) {
        return _monsters[tokenId];
    }
}
