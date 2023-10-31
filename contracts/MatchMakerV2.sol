// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { StringsLibV1 } from "./lib/StringsLibV1.sol";
import { IMoveV1 } from "./interfaces/IMoveV1.sol";
import { IMoveExecutorV1 } from "./interfaces/IMoveExecutorV1.sol";
import { IMonsterV1 } from "./interfaces/IMonsterV1.sol";
import { IMonsterApiV1 } from "./interfaces/IMonsterApiV1.sol";
import { IBaseStatusEffectV1 } from "./interfaces/IBaseStatusEffectV1.sol";
import { IMoveStatusEffectV1 } from "./interfaces/IMoveStatusEffectV1.sol";
import "./interfaces/IGenericEventLoggerV1.sol";

contract MatchMakerV2 is Initializable, OwnableUpgradeable {
    using StringsLibV1 for address;
    using StringsLibV1 for bytes32;

    using Strings for uint256;
    using Strings for uint16;
    using Strings for uint8;

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

    struct MatchView {
        uint256 id;
        Match _match;
        IMonsterV1.Monster challengerFirstMonster;
        IMonsterV1.Monster challengerSecondMonster;
        IMonsterV1.Monster opponentFirstMonster;
        IMonsterV1.Monster opponentSecondMonster;
    }

    struct StatusEffectsContainer {
        uint256 statusEffectCount;
        mapping(uint256 => IBaseStatusEffectV1.StatusEffectWrapper) statusEffects;
    }

    IMonsterApiV1 public monsterApi;
    IMoveExecutorV1 public moveExecutor;
    IGenericEventLoggerV1 public eventLogger;

    uint256 public timeout;
    uint256 public matchCount;

    /// @dev mode => Team
    mapping(uint256 => Team) public queuedTeams;
    mapping(uint256 => Match) public matches;
    mapping(uint256 => IMonsterV1.Monster) public monsters;
    mapping(uint256 => StatusEffectsContainer) public statusEffects;

    /// @dev This allows easier access from the frontend, only one match per owner
    mapping(address => uint256) public accountToMatch;

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
        IGenericEventLoggerV1 _eventLogger,
        uint256 _timeout
    ) external initializer {
        __Ownable_init(msg.sender);

        monsterApi = _monsterApi;
        moveExecutor = _moveExecutor;
        eventLogger = _eventLogger;
        timeout = _timeout;
    }

    function createAndJoin(
        uint256 mode,
        IMonsterApiV1.Monster firstMonster,
        IMonsterApiV1.Monster secondMonster
    ) external {
        uint256 firstMonsterTokenId = monsterApi.createMonsterByName(firstMonster);
        uint256 secondMonsterTokenId = monsterApi.createMonsterByName(secondMonster);

        withdraw(mode);

        join(mode, firstMonsterTokenId, secondMonsterTokenId);
    }

    function join(uint256 mode, uint256 firstMonsterId, uint256 secondMonsterId) public {
        require(accountToMatch[msg.sender] == 0, "MatchMakerV2: already joined");

        monsters[firstMonsterId] = monsterApi.getMonster(firstMonsterId);
        monsters[secondMonsterId] = monsterApi.getMonster(secondMonsterId);

        logMonsterStatus(firstMonsterId, 0);
        logMonsterStatus(secondMonsterId, 0);

        if (queuedTeams[mode].firstMonsterId == 0) {
            queuedTeams[mode] = Team(msg.sender, firstMonsterId, secondMonsterId);
            return;
        }

        require(
            queuedTeams[mode].owner != msg.sender,
            "MatchMakerV2: cannot play against yourself"
        );

        matches[++matchCount] = Match(
            queuedTeams[mode],
            Team(msg.sender, firstMonsterId, secondMonsterId),
            Move(0, IMoveV1(address(0)), 0),
            Move(0, IMoveV1(address(0)), 0),
            Phase.Commit,
            block.timestamp + timeout,
            0
        );

        accountToMatch[queuedTeams[mode].owner] = matchCount;
        accountToMatch[msg.sender] = matchCount;

        string[] memory data = new string[](2);
        data[0] = queuedTeams[mode].owner == address(0) ?
            msg.sender.toString() :
            queuedTeams[mode].owner.toString();
        data[1] = msg.sender.toString();

        eventLogger.logEventByMatchId(
            matchCount,
            "MatchFound",
            data
        );

        delete queuedTeams[mode];
    }

    function withdraw(uint256 mode) public {
        if (queuedTeams[mode].owner == msg.sender) {
            delete queuedTeams[mode];
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

        string[] memory data = new string[](2);
        data[0] = msg.sender.toString();
        data[1] = _commit.toString();

        eventLogger.logEventByMatchId(
            matchId,
            "Commit",
            data
        );
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

        string[] memory data = new string[](2);
        data[0] = msg.sender.toString();
        data[1] = address(move).toString();

        eventLogger.logEventByMatchId(
            matchId,
            "Reveal",
            data
        );

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
            eventLogger.logEventByMatchId(
                matchId,
                "FirstStrike",
                firstStrikerId
            );
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

                string[] memory data = new string[](1);
                data[0] = monsters[_match.challengerTeam.firstMonsterId].hp == 0 &&
                monsters[_match.challengerTeam.secondMonsterId].hp == 0
                    ? _match.opponentTeam.owner.toString()
                    : _match.challengerTeam.owner.toString();

                eventLogger.logEventByMatchId(
                    matchId,
                    "GameOver",
                    data
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
        string[] memory data = new string[](6);
        data[0] = uint8(monsters[monsterId].element).toString();
        data[1] = round.toString();
        data[2] = monsters[monsterId].hp.toString();
        data[3] = monsters[monsterId].attack.toString();
        data[4] = monsters[monsterId].defense.toString();
        data[5] = monsters[monsterId].speed.toString();

        eventLogger.logEventByTokenId(
            monsterId,
            "MonsterStatus",
            data
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
            string[] memory data = new string[](2);
            data[0] = address(statusEffects[monsterId].statusEffects[i].statusEffect).toString();
            data[1] = statusEffects[monsterId].statusEffects[i]
                .remainingTurns
                .toString();

            eventLogger.logEventByTokenId(
                monsterId,
                "StatusEffect",
                data
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

    /**************************************************************************
     * Utility view functions for frontend
     *************************************************************************/
    function getMatchByUser(address user) external view returns (MatchView memory) {
        uint256 matchId = accountToMatch[user];
        Match storage _match = matches[matchId];
        return
            MatchView(
                matchId,
                _match,
                monsters[_match.challengerTeam.firstMonsterId],
                monsters[_match.challengerTeam.secondMonsterId],
                monsters[_match.opponentTeam.firstMonsterId],
                monsters[_match.opponentTeam.secondMonsterId]
            );
    }
}
