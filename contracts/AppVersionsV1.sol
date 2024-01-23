// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AppVersionsV1 is Ownable {
    // desired hash users should have as their version
    uint256 public version;

    constructor(address owner) Ownable(owner) {}

    function setVersion(uint256 _version) external onlyOwner {
        version = _version;
    }
}
