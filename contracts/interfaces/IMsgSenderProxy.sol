// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

interface IMsgSenderProxy {
    struct SignatureRSV {
        bytes32 r;
        bytes32 s;
        uint256 v;
    }

    struct SignIn {
        address user;
        uint32 time;
        SignatureRSV rsv;
    }

    function msgSender(SignIn calldata auth) external view returns (address);
}
