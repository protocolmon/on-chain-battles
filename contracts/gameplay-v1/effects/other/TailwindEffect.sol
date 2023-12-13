// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/BaseMoveStatusEffectWithoutStorageV1.sol";
import { LogActions } from "../../lib/LogActions.sol";

contract TailwindEffect is BaseMoveStatusEffectWithoutStorageV1 {
    function applyEffect(
        IMoveV1 move,
        uint256
    ) external view returns (IMoveV1) {
        return move;
    }

    function applyEffect(
        uint256 randomness
    ) external onlyExecutor override returns (bool isHit) {
        isHit = isRandomHit(randomness, name(), 40);

        logger.log(
            uint256(LogActions.Action.ApplyOtherStatusEffect),
            address(this),
            isHit
        );
    }

    function group()
        external
        pure
        override
        returns (IBaseStatusEffectV1.StatusEffectGroup)
    {
        return IBaseStatusEffectV1.StatusEffectGroup.BUFF;
    }

    function stage() external pure returns (Stage) {
        return Stage.ATTACK;
    }

    function transits() external view override returns (bool) {
        return true;
    }

    function name() public pure returns (string memory) {
        return "tailwind";
    }
}
