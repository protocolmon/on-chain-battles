// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/AccessControl.sol";
import { IEventLoggerV1 } from "./interfaces/IEventLoggerV1.sol";
import { IMonsterV1 } from "./interfaces/IMonsterV1.sol";
import { IMoveV1 } from "./interfaces/IMoveV1.sol";
import { IMoveExecutorV1 } from "./interfaces/IMoveExecutorV1.sol";
import { IBaseStatusEffectV1 } from "./interfaces/IBaseStatusEffectV1.sol";
import { IMonsterStatusEffectV1 } from "./interfaces/IMonsterStatusEffectV1.sol";
import { IMoveStatusEffectV1 } from "./interfaces/IMoveStatusEffectV1.sol";
import "./lib/MathLibV1.sol";

contract MoveExecutorV1 is IMoveExecutorV1, AccessControl {
    using MathLibV1 for uint16;

    bytes32 public constant PERMITTED_ROLE = keccak256("PERMITTED_ROLE");

    constructor(address defaultAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    }

    // Struct to hold monster and its associated data
    struct MonsterData {
        IMonsterV1.Monster monster;
        IMoveV1 move;
        IBaseStatusEffectV1.StatusEffectWrapper[] statusEffects;
        address player;
    }

    function executeMoves(
        IMonsterV1.Monster memory challenger,
        IMonsterV1.Monster memory opponent,
        WrappedMoves memory moves,
        IBaseStatusEffectV1.StatusEffectWrapper[]
            memory challengerStatusEffects,
        IBaseStatusEffectV1.StatusEffectWrapper[] memory opponentStatusEffects,
        uint256 randomness,
        IEventLoggerV1 eventLogger
    )
        external
        onlyRole(PERMITTED_ROLE)
        returns (
            IMonsterV1.Monster memory,
            IMonsterV1.Monster memory,
            IBaseStatusEffectV1.StatusEffectWrapper[] memory,
            IBaseStatusEffectV1.StatusEffectWrapper[] memory
        )
    {
        MonsterData memory attacker = MonsterData(
            challenger,
            moves.challenger.move,
            challengerStatusEffects,
            moves.challenger.player
        );
        MonsterData memory defender = MonsterData(
            opponent,
            moves.opponent.move,
            opponentStatusEffects,
            moves.opponent.player
        );

        // Apply PreMove status effects
        attacker.monster = applyMonsterStatusEffects(
            attacker.monster,
            attacker.statusEffects,
            randomness,
            IMonsterStatusEffectV1.Stage.PRE_MOVE
        );

        defender.monster = applyMonsterStatusEffects(
            defender.monster,
            defender.statusEffects,
            randomness,
            IMonsterStatusEffectV1.Stage.PRE_MOVE
        );

        if (
            !doesChallengerStart(
                attacker.monster,
                defender.monster,
                attacker.move,
                defender.move,
                attacker.statusEffects,
                defender.statusEffects,
                randomness
            )
        ) {
            (attacker, defender) = (defender, attacker);
        }

        eventLogger.setCurrentInfo(
            attacker.player,
            defender.player,
            attacker.monster.tokenId,
            defender.monster.tokenId
        );

        // Execute moves in order
        IMoveV1.MoveInput memory firstMoveInput = IMoveV1.MoveInput(
            attacker.monster,
            defender.monster,
            attacker.statusEffects,
            defender.statusEffects,
            randomness
        );
        IMoveV1.MoveInput memory secondMoveInput = executeAndPrepareForNext(
            attacker.monster,
            attacker.move,
            firstMoveInput
        );

        eventLogger.setCurrentInfo(
            defender.player,
            attacker.player,
            defender.monster.tokenId,
            attacker.monster.tokenId
        );

        IMoveV1.MoveInput memory finalOutcome = executeAndPrepareForNext(
            defender.monster,
            defender.move,
            secondMoveInput
        );

        // Remove expired status effects
        finalOutcome.attackerStatusEffects = removeExpiredStatusEffects(
            finalOutcome.attackerStatusEffects
        );
        finalOutcome.defenderStatusEffects = removeExpiredStatusEffects(
            finalOutcome.defenderStatusEffects
        );

        // Rewind monster status effects
        finalOutcome.attacker = rewindMonsterStatusEffects(
            finalOutcome.attacker,
            finalOutcome.attackerStatusEffects,
            randomness
        );
        finalOutcome.defender = rewindMonsterStatusEffects(
            finalOutcome.defender,
            finalOutcome.defenderStatusEffects,
            randomness
        );

        eventLogger.setCurrentInfo(
            address(0),
            address(0),
            0,
            0
        );

        return (
            applyMonsterStatusEffects(
                finalOutcome.attacker,
                finalOutcome.attackerStatusEffects,
                randomness,
                IMonsterStatusEffectV1.Stage.POST_MOVE
            ),
            applyMonsterStatusEffects(
                finalOutcome.defender,
                finalOutcome.defenderStatusEffects,
                randomness,
                IMonsterStatusEffectV1.Stage.POST_MOVE
            ),
            finalOutcome.attackerStatusEffects,
            finalOutcome.defenderStatusEffects
        );
    }

    /**************************************************************************
     * INTERNAL FUNCTIONS
     *************************************************************************/

    function doesChallengerStart(
        IMonsterV1.Monster memory challenger,
        IMonsterV1.Monster memory opponent,
        IMoveV1 challengerMove,
        IMoveV1 opponentMove,
        IBaseStatusEffectV1.StatusEffectWrapper[]
            memory challengerStatusEffects,
        IBaseStatusEffectV1.StatusEffectWrapper[] memory opponentStatusEffects,
        uint256 randomness
    ) internal view returns (bool) {
        // if one player wants to do damage but the other not, the other player goes first
        IMoveV1.MoveType challengerMoveType = challengerMove.moveType();
        IMoveV1.MoveType opponentMoveType = opponentMove.moveType();

        if (challengerMoveType != opponentMoveType) {
            // if the challenger tries to damage but the opponent doesn't
            if (challengerMoveType == IMoveV1.MoveType.Damage) {
                return false;
                // if the opponent tries to damage but the challenger doesn't
            } else if (opponentMoveType == IMoveV1.MoveType.Damage) {
                return true;
            }
        }

        // if speed is same for both still challenger starts
        bool challengerStarts = challenger.speed >= opponent.speed;

        // chance of 5% that challenger doesn't start
        if (challengerStarts) {
            uint256 random = uint256(
                keccak256(abi.encodePacked(randomness, "challengerStarts"))
            );
            challengerStarts = random % 100 < 95;
        }

        return challengerStarts;
    }

    function getZeroMonster()
        internal
        pure
        returns (IMonsterV1.Monster memory)
    {
        return IMonsterV1.Monster(0, IMonsterV1.Element.None, 0, 0, 0, 0, 0, 0);
    }

    function getZeroMove() internal pure returns (IMoveV1) {
        return IMoveV1(address(0));
    }

    function executeAndPrepareForNext(
        IMonsterV1.Monster memory attacker,
        IMoveV1 move,
        IMoveV1.MoveInput memory input
    ) internal returns (IMoveV1.MoveInput memory) {
        if (attacker.hp == 0) {
            return IMoveV1.MoveInput(
                input.defender,
                input.attacker,
                input.defenderStatusEffects,
                input.attackerStatusEffects,
                input.randomness
            );
        }

        IMoveV1 moveAfterAttackerEffects = applyMoveStatusEffects(
            move,
            input.attackerStatusEffects,
            input.randomness,
            IMoveStatusEffectV1.Stage.ATTACK
        );
        IMoveV1 moveAfterDefenderEffects = applyMoveStatusEffects(
            moveAfterAttackerEffects,
            input.defenderStatusEffects,
            input.randomness,
            IMoveStatusEffectV1.Stage.DEFENSE
        );

        IMoveV1.MoveOutput memory output;
        if (address(moveAfterDefenderEffects) == address(0)) {
            output = IMoveV1.MoveOutput(
                input.attackerStatusEffects,
                input.defenderStatusEffects,
                0,
                0
            );
        } else {
            output = moveAfterDefenderEffects.execute(input);
        }

        input.attacker = applyMonsterStatusEffects(
            attacker,
            output.attackerStatusEffects,
            input.randomness,
            IMonsterStatusEffectV1.Stage.INSTANT
        );

        input.attacker.hp = input.attacker.hp.sub(output.damageAttacker);
        input.defender.hp = input.defender.hp.sub(output.damageDefender);

        if (input.attacker.hp > input.attacker.hpInitial) {
            input.attacker.hp = input.attacker.hpInitial;
        }

        if (input.defender.hp > input.defender.hpInitial) {
            input.defender.hp = input.defender.hpInitial;
        }

        return
            IMoveV1.MoveInput(
                input.defender,
                input.attacker,
                output.defenderStatusEffects,
                output.attackerStatusEffects,
                // we take the same randomness again (not sure if we should do that)
                input.randomness
            );
    }

    /**************************************************************************
     * Status Effect Functions
     *************************************************************************/

    function applyMonsterStatusEffects(
        IMonsterV1.Monster memory monster,
        IBaseStatusEffectV1.StatusEffectWrapper[] memory statusEffects,
        uint256 randomness,
        IMonsterStatusEffectV1.Stage stage
    ) internal returns (IMonsterV1.Monster memory modifiedMon) {
        modifiedMon = monster;

        for (uint256 i = 0; i < statusEffects.length; i++) {
            if (
                statusEffects[i].statusEffect.statusEffectType() !=
                IBaseStatusEffectV1.StatusEffectType.MONSTER
            ) {
                continue;
            }

            IMonsterStatusEffectV1 monsterStatusEffect = IMonsterStatusEffectV1(
                address(statusEffects[i].statusEffect)
            );
            if (monsterStatusEffect.stage() == stage) {
                modifiedMon = monsterStatusEffect.applyEffect(
                    modifiedMon,
                    randomness
                );
            }
        }
    }

    function rewindMonsterStatusEffects(
        IMonsterV1.Monster memory monster,
        IBaseStatusEffectV1.StatusEffectWrapper[] memory statusEffects,
        uint256 randomness
    ) internal view returns (IMonsterV1.Monster memory modifiedMon) {
        modifiedMon = monster;

        for (uint256 i = 0; i < statusEffects.length; i++) {
            if (
                statusEffects[i].statusEffect.statusEffectType() !=
                IBaseStatusEffectV1.StatusEffectType.MONSTER
            ) {
                continue;
            }

            IMonsterStatusEffectV1 monsterStatusEffect = IMonsterStatusEffectV1(
                address(statusEffects[i].statusEffect)
            );
            modifiedMon = monsterStatusEffect.rewindEffect(
                modifiedMon,
                randomness
            );
        }
    }

    function applyMoveStatusEffects(
        IMoveV1 move,
        IBaseStatusEffectV1.StatusEffectWrapper[] memory statusEffects,
        uint256 randomness,
        IMoveStatusEffectV1.Stage stage
    ) internal returns (IMoveV1) {
        IMoveV1 modifiedMove = move;

        for (uint256 i = 0; i < statusEffects.length; i++) {
            if (
                statusEffects[i].statusEffect.statusEffectType() !=
                IBaseStatusEffectV1.StatusEffectType.MOVE
            ) {
                continue;
            }

            IMoveStatusEffectV1 moveStatusEffect = IMoveStatusEffectV1(
                address(statusEffects[i].statusEffect)
            );
            if (moveStatusEffect.stage() == stage) {
                modifiedMove = moveStatusEffect.applyEffect(move, randomness);
                if (modifiedMove == IMoveV1(address(0))) {
                    break;
                }
            }
        }

        return modifiedMove;
    }

    function removeExpiredStatusEffects(
        IBaseStatusEffectV1.StatusEffectWrapper[] memory statusEffects
    ) internal pure returns (IBaseStatusEffectV1.StatusEffectWrapper[] memory) {
        // First, count how many status effects are not expired
        uint256 validStatusEffectCount = 0;
        for (uint256 i = 0; i < statusEffects.length; i++) {
            if (statusEffects[i].remainingTurns != 1) {
                validStatusEffectCount++;
            }
        }

        // Create a new array to hold the valid status effects
        IBaseStatusEffectV1.StatusEffectWrapper[]
            memory newStatusEffects = new IBaseStatusEffectV1.StatusEffectWrapper[](
                validStatusEffectCount
            );

        // Populate the new array with valid status effects
        uint256 newIndex = 0;
        for (uint256 i = 0; i < statusEffects.length; i++) {
            if (statusEffects[i].remainingTurns != 1) {
                newStatusEffects[newIndex] = statusEffects[i];
                newStatusEffects[newIndex].remainingTurns--;
                newIndex++;
            }
        }

        return newStatusEffects;
    }
}
