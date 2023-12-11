// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

interface IRandomnessCallbackV1 {
    function fulfillRandomWords(
        uint256[] memory ids,
        uint256[] memory randomWords
    ) external;
}
