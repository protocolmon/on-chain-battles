// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

interface IBaseStatusEffectV1 {
    enum StatusEffectGroup {
        BUFF,
        DEBUFF,
        WALL
    }

    enum StatusEffectType {
        MONSTER,
        MOVE
    }

    struct StatusEffectWrapper {
        IBaseStatusEffectV1 statusEffect;
        uint8 remainingTurns;
    }

    function applyEffect(uint256 randomness) external returns (bool);

    function extraData() external view returns (uint256);

    function group() external view returns (StatusEffectGroup);

    /// @dev Indicates if only one of the same status effect can be applied
    function isUnique() external view returns (bool);

    /// @dev Return a unique identifier for this status effect (e.g. "critical-hit")
    function name() external view returns (string memory);

    function storeInfo(uint256 monsterId, bytes memory info) external;

    function statusEffectType() external view returns (StatusEffectType);

    function wrap(
        uint8 remainingTurns
    ) external view returns (StatusEffectWrapper memory);
}
