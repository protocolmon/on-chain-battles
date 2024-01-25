// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AppVersionsV1 is Ownable {
    // desired version in semver format (e.g. 1.2.3)
    string public minVersion;

    constructor(address owner) Ownable(owner) {}

    function setVersion(string memory _minVersion) external onlyOwner {
        minVersion = _minVersion;
    }
}
