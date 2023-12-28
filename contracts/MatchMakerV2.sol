// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {StringsLibV1} from "./lib/StringsLibV1.sol";
import {IMoveV1} from "./interfaces/IMoveV1.sol";
import {IMoveExecutorV1} from "./interfaces/IMoveExecutorV1.sol";
import {IMonsterV1} from "./interfaces/IMonsterV1.sol";
import {IMonsterApiV1} from "./interfaces/IMonsterApiV1.sol";
import {IBaseStatusEffectV1} from "./interfaces/IBaseStatusEffectV1.sol";
import {IMoveStatusEffectV1} from "./interfaces/IMoveStatusEffectV1.sol";
import {ILeaderboardV1} from "./interfaces/ILeaderboardV1.sol";
import "./interfaces/IEventLoggerV1.sol";

contract MatchMakerV2 is Initializable, OwnableUpgradeable {
    uint256 public constant LOG_COMMIT = 1_000_000;
    uint256 public constant LOG_REVEAL = 1_000_001;
    // OLD EVENT WAS HERE, THAT'S WHY THE LOG ID 1_000_002 IS MISSING
    uint256 public constant LOG_GAME_OVER = 1_000_003;
    uint256 public constant LOG_MONSTER_DEFEATED = 1_000_004;

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
        address escaped;
    }

    struct MatchView {
        uint256 id;
        Match _match;
        IMonsterV1.Monster challengerMonster1;
        IMonsterV1.Monster challengerMonster2;
        IMonsterV1.Monster opponentMonster1;
        IMonsterV1.Monster opponentMonster2;
        StatusEffectWrapperView[] challengerStatusEffects1;
        StatusEffectWrapperView[] challengerStatusEffects2;
        StatusEffectWrapperView[] opponentStatusEffects1;
        StatusEffectWrapperView[] opponentStatusEffects2;
        address eventLogger;
    }

    struct StatusEffectWrapperView {
        address statusEffect;
        uint8 remainingTurns;
        uint8 group;
    }

    struct StatusEffectsContainer {
        uint256 statusEffectCount;
        mapping(uint256 => IBaseStatusEffectV1.StatusEffectWrapper) statusEffects;
    }

    IMonsterApiV1 public monsterApi;
    IMoveExecutorV1 public moveExecutor;
    IEventLoggerV1 public logger;

    /// @dev Not used anymore, just here because of upgrades (removed later)
    uint256 public timeout;
    uint256 public matchCount;

    /// @dev New upgrade for leaderboard
    ILeaderboardV1 public leaderboard;

    /// @dev mode => Team
    mapping(uint256 => Team) public queuedTeams;
    mapping(uint256 => Match) public matches;
    mapping(uint256 => IMonsterV1.Monster) public monsters;
    mapping(uint256 => StatusEffectsContainer) public statusEffects;

    /// @dev This allows easier access from the frontend, only one match per owner
    mapping(address => uint256) public accountToMatch;

    /// @dev Mapping of game mode to timeout (for playing different round times)
    mapping(uint256 => uint256) public modeToTimeout;

    /// @dev In the next version this should be moved into the struct (doing this for upgrades)
    mapping(uint256 => uint256) public matchToMode;

    /// @dev The move to use for timeouts
    mapping(uint256 => address) public modeToTimeoutMove;

    event WithdrawnBeforeMatch(address indexed player);

    event StatusEffectLog(
        uint256 indexed monsterId,
        uint256 indexed round,
        address indexed statusEffect,
        uint8 remainingTurns
    );

    modifier isInMatch(uint256 matchId) {
        require(
            matches[matchId].challengerTeam.owner == msg.sender ||
                matches[matchId].opponentTeam.owner == msg.sender,
            "MatchMakerV2: not your match"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IMonsterApiV1 _monsterApi,
        IMoveExecutorV1 _moveExecutor,
        IEventLoggerV1 _logger,
        uint256 _timeout
    ) external initializer {
        __Ownable_init(msg.sender);

        monsterApi = _monsterApi;
        moveExecutor = _moveExecutor;
        logger = _logger;
        timeout = _timeout;
    }

    function createAndJoin(
        uint256 mode,
        IMonsterApiV1.Monster firstMonster,
        IMonsterApiV1.Monster secondMonster
    ) external {
        uint256 firstMonsterTokenId = monsterApi.createMonsterByName(
            firstMonster
        );
        uint256 secondMonsterTokenId = monsterApi.createMonsterByName(
            secondMonster
        );

        if (accountToMatch[msg.sender] != 0) {
            withdrawFromMatch(accountToMatch[msg.sender]);
        } else {
            withdraw(mode);
        }

        join(mode, firstMonsterTokenId, secondMonsterTokenId);
    }

    function withdraw(uint256 mode) public {
        if (queuedTeams[mode].owner == msg.sender) {
            delete queuedTeams[mode];
            emit WithdrawnBeforeMatch(msg.sender);
        }
    }

    function withdrawFromMatch(uint256 matchId) public {
        uint256 matchId = accountToMatch[msg.sender];
        require(
            matches[matchId].challengerTeam.owner == msg.sender ||
                matches[matchId].opponentTeam.owner == msg.sender,
            "MatchMakerV2: not your match"
        );
        if (matches[matchId].escaped == address(0)) {
            matches[matchId].escaped = msg.sender;
            if (address(leaderboard) != address(0)) {
                leaderboard.addEscape(msg.sender);
            }
        }
        accountToMatch[msg.sender] = 0;
    }

    function commit(
        uint256 matchId,
        bytes32 _commit
    ) external payable isInMatch(matchId) {
        Match storage _match = matches[matchId];
        require(
            _match.phase == Phase.Commit,
            _match.phase == Phase.GameOver
                ? "MatchMakerV2: game over"
                : "MatchMakerV2: not in commit phase"
        );

        logger.setMatchId(matchId);
        logger.setRound(_match.round);

        bool isChallenger = _match.challengerTeam.owner == msg.sender;
        Move storage relevantMove = isChallenger
            ? _match.currentChallengerMove
            : _match.currentOpponentMove;

        require(relevantMove.commit == 0, "MatchMakerV2: already committed");
        relevantMove.commit = _commit;

        assignMonstersToMove(_match, relevantMove, isChallenger);

        // if both players have committed, move to reveal phase
        if (
            _match.currentChallengerMove.commit != 0 &&
            _match.currentOpponentMove.commit != 0
        ) {
            _match.phase = Phase.Reveal;
            _match.timeout = block.timestamp + getTimeout(matchId);
        }

        logger.log(LOG_COMMIT, msg.sender, _commit);

        logger.setRound(0);
        logger.setMatchId(0);
    }

    function reveal(
        uint256 matchId,
        address move,
        bytes32 secret
    ) public isInMatch(matchId) {
        Match storage _match = matches[matchId];

        // if the round timed out, one player can end it by revealing
        if (_match.timeout >= block.timestamp) {
            /// @dev We might not need this check anymore or could potentially refactor it
            require(
                _match.phase == Phase.Reveal,
                "MatchMakerV2: not in reveal phase"
            );
        }

        logger.setMatchId(matchId);
        logger.setRound(_match.round);

        /// @dev I know this could be done cleaner
        address timeoutMove = modeToTimeoutMove[matchToMode[matchId]];
        revealMove(_match, msg.sender, move, secret, timeoutMove);

        // check if the timeout expired
        if (_match.timeout < block.timestamp) {
            Move storage relevantMove = revealMove(
                _match,
                getOtherPlayerInMatch(_match, msg.sender),
                timeoutMove,
                bytes32(0),
                timeoutMove
            );

            assignMonstersToMove(
                _match,
                relevantMove,
                _match.challengerTeam.owner != msg.sender
            );
        }

        if (
            (address(_match.currentChallengerMove.move) != address(0) &&
                address(_match.currentOpponentMove.move) != address(0))
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
            (
                challengerMonster,
                opponentMonster,
                challengerOutputEffects,
                opponentOutputEffects
            ) = moveExecutor.executeMoves(
                monsters[_match.currentChallengerMove.monsterId],
                monsters[_match.currentOpponentMove.monsterId],
                IMoveExecutorV1.WrappedMoves(
                    IMoveExecutorV1.WrappedMove(
                        _match.currentChallengerMove.move,
                        _match.challengerTeam.owner
                    ),
                    IMoveExecutorV1.WrappedMove(
                        _match.currentOpponentMove.move,
                        _match.opponentTeam.owner
                    )
                ),
                challengerInputEffects,
                opponentInputEffects,
                uint256(blockhash(block.number - 1)), // using pseudo-randomness for first version here
                logger
            );
            monsters[challengerMonster.tokenId] = challengerMonster;
            monsters[opponentMonster.tokenId] = opponentMonster;
            storeStatusEffects(
                challengerMonster.tokenId,
                challengerOutputEffects
            );

            _match.round++;
            storeStatusEffects(opponentMonster.tokenId, opponentOutputEffects);

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
                logger.log(LOG_MONSTER_DEFEATED, challengerMonster.tokenId);
            }

            if (opponentMonster.hp == 0) {
                transitStatusEffects(
                    opponentMonster.tokenId,
                    getOtherMonsterInTeam(
                        opponentMonster.tokenId,
                        _match.challengerTeam,
                        _match.opponentTeam
                    ),
                    _match.round
                );
                logger.log(LOG_MONSTER_DEFEATED, opponentMonster.tokenId);
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

                logger.log(
                    LOG_GAME_OVER,
                    monsters[_match.challengerTeam.secondMonsterId].hp == 0
                        ? _match.opponentTeam.owner
                        : _match.challengerTeam.owner
                );

                if (address(leaderboard) != address(0)) {
                    if (
                        monsters[_match.challengerTeam.secondMonsterId].hp == 0
                    ) {
                        leaderboard.addWin(_match.opponentTeam.owner);
                        leaderboard.addLoss(_match.challengerTeam.owner);
                    } else {
                        leaderboard.addWin(_match.challengerTeam.owner);
                        leaderboard.addLoss(_match.opponentTeam.owner);
                    }
                }
            } else {
                _match.phase = Phase.Commit;
                _match.timeout = block.timestamp + getTimeout(matchId);
            }
        }

        logger.setRound(0);
        logger.setMatchId(0);
    }

    function updateBlockTimestamp() external {
        /// @dev Do nothing but a tx to update the block timestamp
    }

    /**************************************************************************
     * EXTERNAL VIEW FUNCTIONS
     *************************************************************************/

    function getMatchById(uint256 id) public view returns (MatchView memory) {
        Match storage _match = matches[id];
        return
            MatchView(
                id,
                _match,
                monsters[_match.challengerTeam.firstMonsterId],
                monsters[_match.challengerTeam.secondMonsterId],
                monsters[_match.opponentTeam.firstMonsterId],
                monsters[_match.opponentTeam.secondMonsterId],
                getStatusEffectsViewArray(_match.challengerTeam.firstMonsterId),
                getStatusEffectsViewArray(
                    _match.challengerTeam.secondMonsterId
                ),
                getStatusEffectsViewArray(_match.opponentTeam.firstMonsterId),
                getStatusEffectsViewArray(_match.opponentTeam.secondMonsterId),
                address(logger)
            );
    }

    function getMatchByUser(
        address user
    ) external view returns (MatchView memory) {
        uint256 matchId = accountToMatch[user];
        return getMatchById(matchId);
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

    function getStatusEffectsViewArray(
        uint256 monsterId
    ) public view returns (StatusEffectWrapperView[] memory effects) {
        IBaseStatusEffectV1.StatusEffectWrapper[]
            memory statusEffectsArray = getStatusEffectsArray(monsterId);
        effects = new StatusEffectWrapperView[](statusEffectsArray.length);
        for (uint256 i = 0; i < statusEffectsArray.length; i++) {
            effects[i] = StatusEffectWrapperView({
                statusEffect: address(statusEffectsArray[i].statusEffect),
                remainingTurns: statusEffectsArray[i].remainingTurns,
                group: uint8(statusEffectsArray[i].statusEffect.group())
            });
        }
    }

    /**************************************************************************
     * OWNER FUNCTIONS
     *************************************************************************/
    function setLeaderboard(ILeaderboardV1 _leaderboard) external onlyOwner {
        leaderboard = _leaderboard;
    }

    function setTimeout(
        uint256 mode,
        uint256 _timeout,
        address move
    ) external onlyOwner {
        modeToTimeout[mode] = _timeout;
        modeToTimeoutMove[mode] = move;
    }

    /**************************************************************************
     * INTERNAL FUNCTIONS
     *************************************************************************/

    function getTimeout(uint256 matchId) internal view returns (uint256) {
        return modeToTimeout[matchToMode[matchId]];
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

    function getOtherPlayerInMatch(
        Match memory _match,
        address player
    ) internal view returns (address) {
        if (_match.challengerTeam.owner == player) {
            return _match.opponentTeam.owner;
        } else if (_match.opponentTeam.owner == player) {
            return _match.challengerTeam.owner;
        } else {
            revert("MatchMakerV2: no other player in match");
        }
    }

    function join(
        uint256 mode,
        uint256 firstMonsterId,
        uint256 secondMonsterId
    ) internal {
        uint256 existingMatchId = accountToMatch[msg.sender];
        require(
            accountToMatch[msg.sender] == 0 ||
                matches[existingMatchId].escaped != address(0),
            "MatchMakerV2: already in match"
        );

        monsters[firstMonsterId] = monsterApi.getMonster(firstMonsterId);
        monsters[secondMonsterId] = monsterApi.getMonster(secondMonsterId);

        if (queuedTeams[mode].firstMonsterId == 0) {
            queuedTeams[mode] = Team(
                msg.sender,
                firstMonsterId,
                secondMonsterId
            );
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
            block.timestamp + modeToTimeout[mode],
            0,
            address(0)
        );

        /// @dev will move to the struct in the next version
        matchToMode[matchCount] = mode;
        accountToMatch[queuedTeams[mode].owner] = matchCount;
        accountToMatch[msg.sender] = matchCount;

        delete queuedTeams[mode];
    }

    function assignMonstersToMove(
        Match storage _match,
        Move storage move,
        bool isChallenger
    ) internal {
        bool isFirstMonsterDefeated = isChallenger
            ? monsters[_match.challengerTeam.firstMonsterId].hp == 0
            : monsters[_match.opponentTeam.firstMonsterId].hp == 0;

        bool isSecondMonsterDefeated = isChallenger
            ? monsters[_match.challengerTeam.secondMonsterId].hp == 0
            : monsters[_match.opponentTeam.secondMonsterId].hp == 0;

        if (isFirstMonsterDefeated) {
            move.monsterId = isChallenger
                ? _match.challengerTeam.secondMonsterId
                : _match.opponentTeam.secondMonsterId;
        } else {
            move.monsterId = isChallenger
                ? _match.challengerTeam.firstMonsterId
                : _match.opponentTeam.firstMonsterId;
        }
    }

    function revealMove(
        Match storage _match,
        address player,
        address move,
        bytes32 secret,
        address timeoutMove
    ) internal returns (Move storage relevantMove) {
        relevantMove = _match.challengerTeam.owner == player
            ? _match.currentChallengerMove
            : _match.currentOpponentMove;

        require(
            address(relevantMove.move) == address(0),
            "MatchMakerV2: already revealed"
        );

        // only do these checks if the move is not the timeout move
        if (move != timeoutMove) {
            require(relevantMove.commit != 0, "MatchMakerV2: not committed");
            // verify if the commit was made with the secret
            require(
                keccak256(abi.encodePacked(move, secret)) ==
                    relevantMove.commit,
                "MatchMakerV2: invalid secret"
            );
        }

        relevantMove.move = IMoveV1(move);

        logger.log(LOG_REVEAL, player, address(move));
    }

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
        storeStatusEffects(
            fromMonsterId,
            new IBaseStatusEffectV1.StatusEffectWrapper[](0)
        );
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
