// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import {IMonsterV1} from "./IMonsterV1.sol";

interface IMonsterApiV1 {
    enum Monster {
        None,
        Blazehorn,
        Foretusk,
        Aquasteer,
        Thunderhoof,
        Psyhorn,
        Toxicorn,
        Flampanda,
        Verdubear,
        Wavepaw,
        Shockfur,
        Dreamgrowl,
        Poisonclaw,
        Pyrilla,
        Florangutan,
        Tidalmonk,
        Electrang,
        Cerebrilla,
        Gloomgrip,
        Fernopig,
        Leafsnout,
        Streamhog,
        Zappig,
        Enighog,
        Fumebrow,
        Firizard,
        Floralon,
        Reptide,
        Chargecrest,
        Cogniscale,
        Acidtongue,
        Magmaphant,
        Grovemaw,
        Aquarump,
        Voltusk,
        Mentolox,
        Sludgetrunk,
        Flarejaw,
        Verdantide,
        Bubblestream,
        Sparkfin,
        Psycheleap,
        Slimefin,
        Flamlion,
        Greenwhelp,
        Ripplemane,
        Voltmane,
        Cerebropaw,
        Venomroar,
        Emberfuzz,
        Vineroot,
        Bublifox,
        Zaptuft,
        Psygleam,
        Sludgeprowl,
        Cinderplate,
        Terraform,
        Hydroshell,
        Zappadome,
        Mindshell,
        Pestiplate,
        Magmalore,
        Djungalore,
        Tsunalore,
        Shocklore,
        Mentalore,
        Sporelore
    }

    function createMonsterByName(Monster monster) external returns (uint256);

    function getMonster(
        uint256 tokenId
    ) external view returns (IMonsterV1.Monster memory);
}
