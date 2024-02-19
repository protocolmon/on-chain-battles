// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IUsernamesV1.sol";

contract UsernamesV1 is IUsernamesV1, Ownable {
    event NameRegistered(string name, address owner, bool isOwner);
    event NameUnregistered(string name);

    mapping(string => address) public nameToAddress;
    mapping(address => string) public addressToName;

    constructor(address owner) Ownable(owner) {}

    function getNames(
        address[] memory addresses
    ) external view override returns (string[] memory) {
        string[] memory names = new string[](addresses.length);
        for (uint256 i = 0; i < addresses.length; i++) {
            names[i] = addressToName[addresses[i]];
        }
        return names;
    }

    function registerName(string memory name) public {
        require(nameToAddress[name] == address(0), "Name already registered");

        // we delete the old name if it exists
        if (bytes(addressToName[msg.sender]).length != 0) {
            emit NameUnregistered(addressToName[msg.sender]);
            delete nameToAddress[addressToName[msg.sender]];
        }

        // we set the new name
        addressToName[msg.sender] = name;
        nameToAddress[name] = msg.sender;

        emit NameRegistered(name, msg.sender, false);
    }

    function registerNameAsOwner(
        string memory name,
        address user
    ) external onlyOwner {
        addressToName[user] = name;
        nameToAddress[name] = user;

        emit NameRegistered(name, user, true);
    }
}
