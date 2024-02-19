// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

enum PackType {
    ElementalEchoes
}

enum MonsterType {
    Bull,
    Bear,
    Gorilla,
    Boar,
    Lizard,
    Elephant,
    Whale,
    Lion,
    Fox,
    Turtle,
    Dragon
}

enum MonsterElement {
    Fire,
    Nature,
    Water,
    Electric,
    Mental,
    Toxic
}

enum Background {
    Base
}

enum Rarity {
    Common,
    Uncommon,
    Rare,
    VeryRare,
    UltraRare,
    Mythic
}

struct Monster {
    PackType packType;
    MonsterType monsterType;
    MonsterElement element;
    Rarity rarity;
    Background background;
}
