// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./interfaces/IRandomnessV1.sol";

contract MockRandomness is IRandomnessV1 {
    struct Request {
        RequestType requestType;
        uint256[] ids;
        IRandomnessCallbackV1 callback;
    }

    uint256 public counter;

    mapping(address => bool) public whitelist;

    Request[] public pendingRequests;

    constructor() {
        whitelist[msg.sender] = true;
    }

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "MockRandomness: Not whitelisted");
        _;
    }

    function requestRandomWords(
        RequestType requestType,
        uint256[] memory ids,
        IRandomnessCallbackV1 callback
    ) external override onlyWhitelisted returns (uint256) {
        pendingRequests.push(
            Request({requestType: requestType, ids: ids, callback: callback})
        );

        return pendingRequests.length;
    }

    function fulfillAllPending() external {
        // fulfill all pending with pseudo randomness
        for (uint256 i = 0; i < pendingRequests.length; i++) {
            Request memory request = pendingRequests[i];
            uint256[] memory randomWords = new uint256[](request.ids.length);
            for (uint256 j = 0; j < request.ids.length; j++) {
                randomWords[j] = uint256(
                    keccak256(abi.encodePacked(counter++))
                );
            }
            if (randomWords.length == 0) {
                randomWords = new uint256[](1);
                randomWords[0] = uint256(
                    keccak256(abi.encodePacked(counter++))
                );
            }
            request.callback.fulfillRandomWords(request.ids, randomWords);
        }

        delete pendingRequests;
    }

    function setWhitelist(
        address _address,
        bool _whitelisted
    ) external override onlyWhitelisted {
        whitelist[_address] = _whitelisted;
    }
}
