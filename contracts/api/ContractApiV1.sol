// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

contract ContractApiV1 {
    /// @dev version => name => address
    mapping(uint256 => mapping(string => address)) contracts;

    function getContract(
        uint256 version,
        string memory name
    ) public view returns (address) {
        return contracts[version][name];
    }

    function getContracts(
        uint256 version,
        string[] memory names
    ) public view returns (address[] memory) {
        address[] memory result = new address[](names.length);
        for (uint256 i = 0; i < names.length; i++) {
            result[i] = contracts[version][names[i]];
        }
        return result;
    }

    function setContract(
        uint256 version,
        string memory name,
        address contractAddress
    ) public {
        contracts[version][name] = contractAddress;
    }
}
