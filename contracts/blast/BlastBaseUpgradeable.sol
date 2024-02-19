// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IBlast} from "./IBlast.sol";

contract BlastBaseUpgradeable is Initializable {
    IBlast public blast;
    address public claimer;

    modifier onlyClaimer() {
        require(
            msg.sender == claimer,
            "BlastBaseUpgradeable: caller is not the claimer"
        );
        _;
    }

    function __BlastBase_init(
        IBlast _blast,
        address _claimer
    ) internal onlyInitializing {
        blast = _blast;
        claimer = _claimer;
    }

    function claimAllGas(
        address contractAddress,
        address recipientOfGas
    ) external onlyClaimer returns (uint256) {
        return blast.claimAllGas(contractAddress, recipientOfGas);
    }

    function claimGasAtMinClaimRate(
        address contractAddress,
        address recipientOfGas,
        uint256 minClaimRateBips
    ) external onlyClaimer returns (uint256) {
        return
            blast.claimGasAtMinClaimRate(
                contractAddress,
                recipientOfGas,
                minClaimRateBips
            );
    }

    function claimMaxGas(
        address contractAddress,
        address recipientOfGas
    ) external onlyClaimer returns (uint256) {
        return blast.claimMaxGas(contractAddress, recipientOfGas);
    }

    function claimGas(
        address contractAddress,
        address recipientOfGas,
        uint256 gasToClaim,
        uint256 gasSecondsToConsume
    ) external onlyClaimer returns (uint256) {
        return
            blast.claimGas(
                contractAddress,
                recipientOfGas,
                gasToClaim,
                gasSecondsToConsume
            );
    }

    function setBlast(IBlast blast_) external onlyClaimer {
        blast = blast_;
    }

    function setClaimer(address claimer_) external onlyClaimer {
        claimer = claimer_;
    }
}
