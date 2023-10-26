// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import { IMonsterV1 } from "./IMonsterV1.sol";

interface IMonsterApiV1 {
    enum Monster {
        None,
        Blazehorn,
        Foretusk,
        Aquasteer,
        Flampanda,
        Verdubear,
        Wavepaw,
        Pyrilla,
        Florangutan,
        Tidalmonk,
        Fernopig,
        Leafsnout,
        Streamhog
    }

    function createMonsterByName(Monster monster) external returns (uint256);

    function getMonster(
        uint256 tokenId
    ) external view returns (IMonsterV1.Monster memory);
}
