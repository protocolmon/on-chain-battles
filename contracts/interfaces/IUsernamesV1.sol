// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

interface IUsernamesV1 {
    function getNames(
        address[] memory addresses
    ) external view returns (string[] memory);
}
