// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./IRandomnessCallbackV1.sol";

interface IRandomnessV1 {
    enum RequestType {
        None,
        Monsters,
        Adventures,
        Tournaments,
        Missions,
        Matches
    }

    /// @param ids can be used for e.g. tokenIds or adventureIds, ...
    function requestRandomWords(
        RequestType requestType,
        uint256[] memory ids,
        IRandomnessCallbackV1 callback
    ) external returns (uint256 requestId);

    function setWhitelist(address _address, bool _whitelisted) external;
}
