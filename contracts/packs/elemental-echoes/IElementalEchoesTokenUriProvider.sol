// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import {Monster} from "./ElementalEchoesMonster.sol";

interface IElementalEchoesTokenUriProvider {
    function tokenURI(uint256 tokenId) external view returns (string memory);

    function tokenURI(
        uint256 tokenId,
        Monster memory monster
    ) external view returns (string memory);
}
