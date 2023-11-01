// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../abstract/BaseMoveStatusEffectWithoutStorageV1.sol";

contract CloudCoverEffect is BaseMoveStatusEffectWithoutStorageV1 {
    uint8 public chance;

    constructor(uint8 _chance) {
        chance = _chance;
    }

    function applyEffect(
        IMoveV1 move,
        uint256 randomness
    ) external override returns (IMoveV1 returnMove) {
        returnMove = move;

        bool isHit = move.moveType() == IMoveV1.MoveType.Damage && isRandomHit(randomness, name(), chance);
        if (isHit) {
            returnMove = IMoveV1(address(0));
        }

        logger.log(
            "SEA",
            address(this),
            address(move),
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

    function stage() external pure override returns (Stage) {
        return Stage.DEFENSE;
    }

    function transits() external view override returns (bool) {
        return true;
    }

    function name() public pure override returns (string memory) {
        return "cloud-cover";
    }

    function setChance(uint8 _chance) external {
        chance = _chance;
    }
}
