// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

contract ConfidentialTester {
    mapping(address => string) internal confidentialData;

    function getConfidentialData() external view returns (string memory) {
        return confidentialData[msg.sender];
    }

    function setConfidentialData(string memory data) external {
        confidentialData[msg.sender] = data;
    }
}
