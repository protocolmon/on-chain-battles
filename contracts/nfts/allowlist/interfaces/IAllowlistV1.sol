// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

interface IAllowlistV1 {
    function isAllowed(
        address account
    ) external view returns (bool allowed, bool hasCallback);
}
