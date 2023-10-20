// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../lib/MathLibV1.sol";
import "../../../abstract/BaseMonsterStatusEffectWithStorageV1.sol";

contract DamageOverTimeEffect is BaseMonsterStatusEffectWithStorageV1 {
    using MathLibV1 for uint16;

    function applyEffect(
        IMonsterV1.Monster memory monster,
        uint256 randomness
    ) external view returns (IMonsterV1.Monster memory) {
        uint16 damage = abi.decode(store[monster.tokenId], (uint16));

        monster.hp = monster.hp.sub(damage);

        return monster;
    }

    function group()
        external
        pure
        override
        returns (IBaseStatusEffectV1.StatusEffectGroup)
    {
        return IBaseStatusEffectV1.StatusEffectGroup.DEBUFF;
    }

    function stage() external pure override returns (Stage) {
        return Stage.POST_MOVE;
    }

    function name() external pure override returns (string memory) {
        return "damage-over-time";
    }
}
