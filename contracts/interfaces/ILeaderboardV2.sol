// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

interface ILeaderboardV2 {
    function addEscape(address player) external;

    function addWin(address player) external;

    function addLoss(address player) external;
}
