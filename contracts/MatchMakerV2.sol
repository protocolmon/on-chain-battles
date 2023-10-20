// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import { IMoveV1 } from "./interfaces/IMoveV1.sol";
import { IMoveExecutorV1 } from "./interfaces/IMoveExecutorV1.sol";
import { IMonsterV1 } from "./interfaces/IMonsterV1.sol";
import { IMonsterApiV1 } from "./interfaces/IMonsterApiV1.sol";
import { IBaseStatusEffectV1 } from "./interfaces/IBaseStatusEffectV1.sol";
import { IMoveStatusEffectV1 } from "./interfaces/IMoveStatusEffectV1.sol";

contract MatchMakerV2 is Initializable, OwnableUpgradeable {
    enum Phase {
        Commit,
        Reveal,
        GameOver
    }

    struct Team {
        address owner;
        uint256 firstMonsterId;
        uint256 secondMonsterId;
    }

    struct Move {
        bytes32 commit;
        IMoveV1 move;
        uint256 monsterId;
    }

    struct Match {
        Team challengerTeam;
        Team opponentTeam;
        Move currentChallengerMove;
        Move currentOpponentMove;
        Phase phase;
        uint256 timeout;
        uint256 round;
    }

    struct StatusEffectsContainer {
        uint256 statusEffectCount;
        mapping(uint256 => IBaseStatusEffectV1.StatusEffectWrapper) statusEffects;
    }

    IMonsterApiV1 public monsterApi;
    IMoveExecutorV1 public moveExecutor;

    Team public queuedTeam;
    uint256 public timeout;
    uint256 public matchCount;

    mapping(uint256 => Match) public matches;
    mapping(uint256 => IMonsterV1.Monster) public monsters;
    mapping(uint256 => StatusEffectsContainer) public statusEffects;

    event MatchJoined(
        uint256 indexed matchId,
        address indexed challenger,
        address indexed opponent
    );

    event MoveCommitted(
        uint256 indexed matchId,
        address indexed player,
        bytes32 indexed commit
    );

    event MoveRevealed(
        uint256 indexed matchId,
        address indexed player,
        IMoveV1 indexed move
    );

    event MonsterStatusLog(
        uint256 indexed monsterId,
        uint256 indexed round,
        uint8 element,
        uint16 hp,
        uint16 attack,
        uint16 defense,
        uint16 speed
    );

    event FirstStrike(uint256 indexed matchId, uint256 indexed monsterId);
    event GameOver(uint256 indexed matchId, address indexed winner);
    event WithdrawnBeforeMatch(address indexed player);

    event StatusEffectLog(
        uint256 indexed monsterId,
        uint256 indexed round,
        address indexed statusEffect,
        uint8 remainingTurns
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IMonsterApiV1 _monsterApi,
        IMoveExecutorV1 _moveExecutor,
        uint256 _timeout
    ) external initializer {
        __Ownable_init(msg.sender);

        monsterApi = _monsterApi;
        moveExecutor = _moveExecutor;
        timeout = _timeout;
    }

    function join(uint256 firstMonsterId, uint256 secondMonsterId) external {
        monsters[firstMonsterId] = monsterApi.getMonster(firstMonsterId);
        monsters[secondMonsterId] = monsterApi.getMonster(secondMonsterId);

        logMonsterStatus(firstMonsterId, 0);
        logMonsterStatus(secondMonsterId, 0);

        if (queuedTeam.firstMonsterId == 0) {
            queuedTeam = Team(msg.sender, firstMonsterId, secondMonsterId);
            return;
        }

        require(
            queuedTeam.owner != msg.sender,
            "MatchMakerV2: cannot play against yourself"
        );
        matches[++matchCount] = Match(
            queuedTeam,
            Team(msg.sender, firstMonsterId, secondMonsterId),
            Move(0, IMoveV1(address(0)), 0),
            Move(0, IMoveV1(address(0)), 0),
            Phase.Commit,
            block.timestamp + timeout,
            0
        );

        emit MatchJoined(
            matchCount,
            queuedTeam.owner == address(0) ? msg.sender : queuedTeam.owner,
            msg.sender
        );

        delete queuedTeam;
    }

    function withdraw() external {
        if (queuedTeam.owner == msg.sender) {
            delete queuedTeam;
            emit WithdrawnBeforeMatch(msg.sender);
        }
    }

    function commit(uint256 matchId, bytes32 _commit) external payable {
        Match storage _match = matches[matchId];
        require(
            _match.phase == Phase.Commit,
            _match.phase == Phase.GameOver
                ? "MatchMakerV2: game over"
                : "MatchMakerV2: not in commit phase"
        );
        require(
            _match.timeout > block.timestamp,
            "MatchMakerV2: commit timeout"
        );

        bool isChallenger = _match.challengerTeam.owner == msg.sender;
        Move storage relevantMove = isChallenger
            ? _match.currentChallengerMove
            : _match.currentOpponentMove;

        bool isFirstMonsterDefeated = isChallenger
            ? monsters[_match.challengerTeam.firstMonsterId].hp == 0
            : monsters[_match.opponentTeam.firstMonsterId].hp == 0;

        bool isSecondMonsterDefeated = isChallenger
            ? monsters[_match.challengerTeam.secondMonsterId].hp == 0
            : monsters[_match.opponentTeam.secondMonsterId].hp == 0;

        require(relevantMove.commit == 0, "MatchMakerV2: already committed");
        relevantMove.commit = _commit;

        if (isFirstMonsterDefeated) {
            relevantMove.monsterId = isChallenger
                ? _match.challengerTeam.secondMonsterId
                : _match.opponentTeam.secondMonsterId;
        } else {
            relevantMove.monsterId = isChallenger
                ? _match.challengerTeam.firstMonsterId
                : _match.opponentTeam.firstMonsterId;
        }

        // if both players have committed, move to reveal phase
        if (
            _match.currentChallengerMove.commit != 0 &&
            _match.currentOpponentMove.commit != 0
        ) {
            _match.phase = Phase.Reveal;
            _match.timeout = block.timestamp + timeout;
        }

        emit MoveCommitted(matchId, msg.sender, _commit);
    }

    function reveal(uint256 matchId, address move, bytes32 secret) external {
        Match storage _match = matches[matchId];
        require(
            _match.phase == Phase.Reveal,
            "MatchMakerV2: not in reveal phase"
        );
        require(
            _match.timeout > block.timestamp,
            "MatchMakerV2: reveal timeout"
        );

        Move storage relevantMove = _match.challengerTeam.owner == msg.sender
            ? _match.currentChallengerMove
            : _match.currentOpponentMove;

        require(relevantMove.commit != 0, "MatchMakerV2: not committed");
        require(
            address(relevantMove.move) == address(0),
            "MatchMakerV2: already revealed"
        );

        // verify if the commit was made with the secret
        require(
            keccak256(abi.encodePacked(move, secret)) == relevantMove.commit,
            "MatchMakerV2: invalid secret"
        );

        relevantMove.move = IMoveV1(move);

        emit MoveRevealed(matchId, msg.sender, IMoveV1(move));

        if (
            address(_match.currentChallengerMove.move) != address(0) &&
            address(_match.currentOpponentMove.move) != address(0)
        ) {
            IBaseStatusEffectV1.StatusEffectWrapper[]
                memory challengerInputEffects = getStatusEffectsArray(
                    _match.currentChallengerMove.monsterId
                );
            IBaseStatusEffectV1.StatusEffectWrapper[]
                memory opponentInputEffects = getStatusEffectsArray(
                    _match.currentOpponentMove.monsterId
                );

            IMonsterV1.Monster memory challengerMonster;
            IMonsterV1.Monster memory opponentMonster;
            IBaseStatusEffectV1.StatusEffectWrapper[]
                memory challengerOutputEffects;
            IBaseStatusEffectV1.StatusEffectWrapper[]
                memory opponentOutputEffects;
            uint256 firstStrikerId;
            (
                challengerMonster,
                opponentMonster,
                challengerOutputEffects,
                opponentOutputEffects,
                firstStrikerId
            ) = moveExecutor.executeMoves(
                monsters[_match.currentChallengerMove.monsterId],
                monsters[_match.currentOpponentMove.monsterId],
                _match.currentChallengerMove.move,
                _match.currentOpponentMove.move,
                challengerInputEffects,
                opponentInputEffects,
                uint256(blockhash(block.number - 1)) // using pseudo-randomness for first version here
            );
            monsters[challengerMonster.tokenId] = challengerMonster;
            monsters[opponentMonster.tokenId] = opponentMonster;
            storeStatusEffects(
                challengerMonster.tokenId,
                challengerOutputEffects
            );

            _match.round++;
            storeStatusEffects(opponentMonster.tokenId, opponentOutputEffects);
            emit FirstStrike(matchId, firstStrikerId);
            logMonsterStatus(challengerMonster.tokenId, _match.round);
            logMonsterStatus(opponentMonster.tokenId, _match.round);
            logStatusEffects(challengerMonster.tokenId, _match.round);
            logStatusEffects(opponentMonster.tokenId, _match.round);

            if (challengerMonster.hp == 0) {
                transitStatusEffects(
                    challengerMonster.tokenId,
                    getOtherMonsterInTeam(
                        challengerMonster.tokenId,
                        _match.challengerTeam,
                        _match.opponentTeam
                    ),
                    _match.round
                );
            } else if (opponentMonster.hp == 0) {
                transitStatusEffects(
                    opponentMonster.tokenId,
                    getOtherMonsterInTeam(
                        opponentMonster.tokenId,
                        _match.challengerTeam,
                        _match.opponentTeam
                    ),
                    _match.round
                );
            }

            // reset moves
            _match.currentChallengerMove.commit = 0;
            _match.currentChallengerMove.move = IMoveV1(address(0));
            _match.currentChallengerMove.monsterId = 0;
            _match.currentOpponentMove.commit = 0;
            _match.currentOpponentMove.move = IMoveV1(address(0));
            _match.currentOpponentMove.monsterId = 0;

            // set back to commit phase or if one player has no monster left, set to GameOver
            if (
                (monsters[_match.challengerTeam.firstMonsterId].hp == 0 &&
                    monsters[_match.challengerTeam.secondMonsterId].hp == 0) ||
                (monsters[_match.opponentTeam.firstMonsterId].hp == 0 &&
                    monsters[_match.opponentTeam.secondMonsterId].hp == 0)
            ) {
                _match.phase = Phase.GameOver;
                emit GameOver(
                    matchId,
                    monsters[_match.challengerTeam.firstMonsterId].hp == 0 &&
                        monsters[_match.challengerTeam.secondMonsterId].hp == 0
                        ? _match.opponentTeam.owner
                        : _match.challengerTeam.owner
                );
            } else {
                _match.phase = Phase.Commit;
                _match.timeout = block.timestamp + timeout;
            }
        }
    }

    function getOtherMonsterInTeam(
        uint256 monsterId,
        Team memory teamA,
        Team memory teamB
    ) internal pure returns (uint256) {
        // search in both teams
        if (monsterId == teamA.firstMonsterId) {
            return teamA.secondMonsterId;
        } else if (monsterId == teamA.secondMonsterId) {
            return teamA.firstMonsterId;
        } else if (monsterId == teamB.firstMonsterId) {
            return teamB.secondMonsterId;
        } else if (monsterId == teamB.secondMonsterId) {
            return teamB.firstMonsterId;
        } else {
            return 0;
        }
    }

    function getStatusEffectsArray(
        uint256 monsterId
    )
        public
        view
        returns (IBaseStatusEffectV1.StatusEffectWrapper[] memory effects)
    {
        effects = new IBaseStatusEffectV1.StatusEffectWrapper[](
            statusEffects[monsterId].statusEffectCount
        );
        for (
            uint256 i = 0;
            i < statusEffects[monsterId].statusEffectCount;
            i++
        ) {
            effects[i] = statusEffects[monsterId].statusEffects[i];
        }
    }

    function logMonsterStatus(uint256 monsterId, uint256 round) internal {
        emit MonsterStatusLog(
            monsterId,
            round,
            uint8(monsters[monsterId].element),
            monsters[monsterId].hp,
            monsters[monsterId].attack,
            monsters[monsterId].defense,
            monsters[monsterId].speed
        );
    }

    /**************************************************************************
     * Status Effect Functions
     *************************************************************************/

    function transitStatusEffects(
        uint256 fromMonsterId,
        uint256 toMonsterId,
        uint256 round
    ) internal {
        IBaseStatusEffectV1.StatusEffectWrapper[]
            memory fromEffects = getStatusEffectsArray(fromMonsterId);

        // Create a dynamic array to store status effects that need to be transited.
        IBaseStatusEffectV1.StatusEffectWrapper[]
            memory transitingEffects = new IBaseStatusEffectV1.StatusEffectWrapper[](
                fromEffects.length
            );
        uint256 count = 0;

        for (uint256 i = 0; i < fromEffects.length; i++) {
            IBaseStatusEffectV1 statusEffectInstance = fromEffects[i]
                .statusEffect;

            if (
                statusEffectInstance.statusEffectType() ==
                IBaseStatusEffectV1.StatusEffectType.MOVE &&
                IMoveStatusEffectV1(address(statusEffectInstance)).transits()
            ) {
                transitingEffects[count] = fromEffects[i];
                count++;
            }
        }

        // Trim the array to fit the exact count of effects
        IBaseStatusEffectV1.StatusEffectWrapper[]
            memory toEffects = new IBaseStatusEffectV1.StatusEffectWrapper[](
                count
            );
        for (uint256 i = 0; i < count; i++) {
            toEffects[i] = transitingEffects[i];
        }

        storeStatusEffects(toMonsterId, toEffects);
        logStatusEffects(toMonsterId, round);
    }

    function logStatusEffects(uint256 monsterId, uint256 round) internal {
        for (
            uint256 i = 0;
            i < statusEffects[monsterId].statusEffectCount;
            i++
        ) {
            emit StatusEffectLog(
                monsterId,
                round,
                address(statusEffects[monsterId].statusEffects[i].statusEffect),
                statusEffects[monsterId].statusEffects[i].remainingTurns
            );
        }
    }

    function storeStatusEffects(
        uint256 monsterId,
        IBaseStatusEffectV1.StatusEffectWrapper[] memory effects
    ) internal {
        statusEffects[monsterId].statusEffectCount = effects.length;
        for (uint256 i = 0; i < effects.length; i++) {
            statusEffects[monsterId].statusEffects[i] = effects[i];
        }
    }
}
