// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "../../../../../abstract/MoveV1.sol";

abstract contract BaseConfusedMove is MoveV1 {
    IMoveV1 public immutable originalMove;

    constructor(IMoveV1 _originalMove) {
        originalMove = _originalMove;
    }

    function execute(
        IMoveV1.MoveInput memory input
    ) external onlyExecutor override returns (IMoveV1.MoveOutput memory) {
        IMoveV1.MoveOutput memory output = originalMove.execute(
            IMoveV1.MoveInput(
                input.attacker,
                input.attacker,
                input.attackerStatusEffects,
                input.attackerStatusEffects,
                input.randomness
            )
        );

        output.damageAttacker = output.damageDefender;
        output.defenderStatusEffects = input.defenderStatusEffects;

        return output;
    }

    function moveType() external view override returns (MoveType) {
        return originalMove.moveType();
    }
}
