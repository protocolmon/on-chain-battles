import { ethers } from "hardhat";
import chalk from "chalk";
import {
  MonsterApiV1,
  MatchMakerV2,
  EventEmitterV1,
  GenericEventLoggerV1,
} from "../typechain-types";
import {
  attacks,
  monsterIds,
  monsters,
  translateEffectByAddress,
  translateElement,
  translateMoveByAddress,
} from "./utils/fixtures";
import { getCommitHash } from "./utils/commit";
import { getContractInstance } from "./utils/contracts";
import { promptManager } from "./prompt/PromptManager";
import { logger } from "./logger/Logger";
import {
  monsterStatusBox,
  monsterStatusBoxOpponent,
  statusEffectsBox,
  statusEffectsBoxOpponent,
} from "./blessed/windows";

type StatusEffect = {
  name: string;
  remainingTurns: number;
};

let isGameOver: boolean = false;
let selfAddress: string;
let matchId: bigint;
let firstMonsterId: bigint;
let secondMonsterId: bigint;
let firstOpponentMonsterId: bigint;
let secondOpponentMonsterId: bigint;
let firstAttackDone = false;
let currentRound = 0;
let activeMonsterId: bigint = BigInt(0);
let activeOpponentMonsterId: bigint = BigInt(0);

let statusEffectsByMonsterId: Map<bigint, StatusEffect[]> = new Map();

const GAS_LIMIT = 3_000_000;

const logMonsterStatus = async (
  monsterId: bigint,
  round: bigint,
  element: bigint,
  hp: bigint,
  attack: bigint,
  defense: bigint,
  speed: bigint,
) => {
  if (!matchId || monsterId == BigInt(0)) {
    return;
  }

  // const { default: chalk } = await import("chalk");

  let isOpponent =
    monsterId == firstOpponentMonsterId || monsterId == secondOpponentMonsterId;

  if (monsterId == firstMonsterId || monsterId == secondMonsterId) {
    isOpponent = false;
  }

  logger.log(
    `Monster Status Log: ${
      isOpponent ? "Opponent" : "You"
    } Monster ID: ${monsterId} Round: ${round} Element: ${translateElement(
      Number(element),
    )} HP: ${hp} Attack: ${attack} Defense: ${defense} Speed: ${speed}`,
  );

  const box = isOpponent ? monsterStatusBoxOpponent : monsterStatusBox;

  if (monsterId === activeMonsterId || monsterId === activeOpponentMonsterId) {
    const matchMakerV2 =
      await getContractInstance<MatchMakerV2>("MatchMakerV2");
    let tokenId: bigint = BigInt(0);

    if (monsterId === activeMonsterId && hp === BigInt(0)) {
      activeMonsterId = secondMonsterId;
      [tokenId, element, hp, attack, defense, speed] =
        await matchMakerV2.monsters(secondMonsterId);
      updateStatusEffectBoxes(false);
    } else if (monsterId === activeOpponentMonsterId && hp === BigInt(0)) {
      activeOpponentMonsterId = secondOpponentMonsterId;
      [tokenId, element, hp, attack, defense, speed] =
        await matchMakerV2.monsters(secondOpponentMonsterId);
      updateStatusEffectBoxes(true);
    }

    box?.setContent(`${chalk.white(
      `${isOpponent ? "Opponent" : "Your"} ID: ${
        tokenId == BigInt(0) ? monsterId : tokenId
      } Round: ${round} Element: ${translateElement(Number(element))}`,
    )}
${chalk.white(`Attack: ${attack} Defense: ${defense} Speed: ${speed}`)}
${chalk.white(`HP: ${hp} `)}
`);

    box?.screen.render();
  }
};

async function chooseAttack(
  challenger: string,
  opponent: string,
  matchMakerV2: MatchMakerV2,
) {
  if (isGameOver) {
    return;
  }
  const selectedAttack = await promptManager.createPrompt(
    "select",
    "Select an attack:",
    Object.keys(attacks),
  );

  logger.log(`Selected attack: ${selectedAttack}`);
  // @ts-ignore
  const attackAddress = attacks[Object.keys(attacks)[selectedAttack]];
  if (!attackAddress) {
    logger.log(chalk.redBright(`Attack ${selectedAttack} not found`));
  }
  const commit = await getCommitHash(attackAddress!);
  lastAttack = attackAddress!;

  await matchMakerV2.commit(matchId, commit, { gasLimit: GAS_LIMIT });
}

async function updateStatusEffectBoxes(isOpponent: boolean) {
  // const { default: chalk } = await import("chalk");

  if (!isOpponent) {
    // update the status effect box
    statusEffectsBox?.setContent(
      statusEffectsByMonsterId
        .get(activeMonsterId)!
        .map(
          (statusEffect) =>
            `${chalk.white(
              `${statusEffect.name} ${statusEffect.remainingTurns}`,
            )}`,
        )
        .join("\n"),
    );
    statusEffectsBox?.screen.render();
  }

  if (isOpponent) {
    statusEffectsBoxOpponent?.setContent(
      statusEffectsByMonsterId
        .get(activeOpponentMonsterId)!
        .map(
          (statusEffect) =>
            `${chalk.white(
              `${statusEffect.name} ${statusEffect.remainingTurns}`,
            )}`,
        )
        .join("\n"),
    );
    statusEffectsBoxOpponent?.screen.render();
  }
}

async function setupEventListener(matchMakerV2: MatchMakerV2): Promise<bigint> {
  return new Promise<bigint>(async (resolve) => {
    // const { default: chalk } = await import("chalk");

    // @ts-ignore
    matchMakerV2.runner.provider.pollingInterval = 5000;

    setInterval(() => {
      return new Promise(async (resolve) => {
        try {
          // query the current match from the matchmaker
          const [
            _matchId,
            [
              [challenger, challengerFirstMonsterId, challengerSecondMonsterId],
              [opponent, opponentFirstMonsterId, opponentSecondMonsterId],
              _,
              __,
              ___,
              ____,
              rounds,
            ],
            [],
            [],
          ] = await matchMakerV2.getMatchByUser(selfAddress);

          if (!matchId) {
            matchId = _matchId;

            if (challenger === selfAddress) {
              firstMonsterId = challengerFirstMonsterId;
              secondMonsterId = challengerSecondMonsterId;
              activeMonsterId = challengerFirstMonsterId;
              activeOpponentMonsterId = opponentFirstMonsterId;
              firstOpponentMonsterId = opponentFirstMonsterId;
              secondOpponentMonsterId = opponentSecondMonsterId;
            } else {
              firstMonsterId = opponentFirstMonsterId;
              secondMonsterId = opponentSecondMonsterId;
              activeMonsterId = opponentFirstMonsterId;
              activeOpponentMonsterId = challengerFirstMonsterId;
              firstOpponentMonsterId = challengerFirstMonsterId;
              secondOpponentMonsterId = challengerSecondMonsterId;
            }

            for (const monsterId of [
              challengerFirstMonsterId,
              challengerSecondMonsterId,
              opponentFirstMonsterId,
              opponentSecondMonsterId,
            ]) {
              const [tokenId, element, hp, attack, defense, speed] =
                await matchMakerV2.monsters(monsterId);

              logMonsterStatus(
                monsterId,
                BigInt(0),
                element,
                hp,
                attack,
                defense,
                speed,
              );
            }
          }

          for (const monsterId of [
            challengerFirstMonsterId,
            challengerSecondMonsterId,
            opponentFirstMonsterId,
            opponentSecondMonsterId,
          ]) {
            if (!statusEffectsByMonsterId.has(monsterId)) {
              statusEffectsByMonsterId.set(monsterId, []);
            }
          }

          if (
            rounds > BigInt(currentRound) ||
            (!firstAttackDone &&
              activeMonsterId !== BigInt(0) &&
              activeOpponentMonsterId !== BigInt(0))
          ) {
            currentRound = Number(rounds);
            logger.log(`Round: ${currentRound}`);
            firstAttackDone = true;

            await chooseAttack(challenger, opponent, matchMakerV2);
          }
        } catch (e: any) {
          logger.log(
            chalk.redBright(`Error from choose attack modal: ${e.message}`),
          );
        }
      });
    }, 2000);

    const eventLogger = await getContractInstance<GenericEventLoggerV1>(
      "GenericEventLoggerV1",
    );
    // @ts-ignore
    eventLogger.runner.provider.pollingInterval = 5000;

    eventLogger.on(
      "TokenLogEvent" as unknown as any,
      async (monsterId: bigint, name: string, data: string[]) => {
        if (
          monsterId !== firstMonsterId &&
          monsterId !== secondMonsterId &&
          monsterId !== firstOpponentMonsterId &&
          monsterId !== secondOpponentMonsterId
        ) {
          return;
        }

        logger.log(
          `Token Log Event Monster ID: ${monsterId} Name: ${name} Data: ${data}`,
        );

        if (name === "StatusEffect") {
          try {
            const isOpponent =
              monsterId != firstMonsterId && monsterId != secondMonsterId;

            logger.log(
              `Status Effect Log ${
                isOpponent ? "Opponent" : "You"
              } Monster ID: ${monsterId} Status Effect: ${translateEffectByAddress(
                data[0],
              )} Remaining Turns: ${data[1]}`,
            );

            statusEffectsByMonsterId.get(monsterId)!.push({
              name: translateEffectByAddress(data[0]),
              remainingTurns: Number(data[1]),
            });

            updateStatusEffectBoxes(isOpponent);
          } catch (e: any) {
            logger.log(chalk.redBright(e.message));
          }
        } else if (name === "MonsterStatus") {
          if (
            monsterId !== activeMonsterId &&
            monsterId !== activeOpponentMonsterId
          ) {
            return;
          }

          if (firstAttackDone) {
            logMonsterStatus(
              monsterId,
              BigInt(data[0]),
              BigInt(data[1]),
              BigInt(data[2]),
              BigInt(data[3]),
              BigInt(data[4]),
              BigInt(data[5]),
            );
          }
        }
      },
    );

    // eventLogger.on(
    //   "BattleLogDamage" as unknown as any,
    //   async (
    //     attackerMonsterId: bigint,
    //     defenderMonsterId: bigint,
    //     move: string,
    //     damage: bigint,
    //     elementalEffectiveness: bigint,
    //     isCritical: boolean,
    //   ) => {
    //     const elementalEffectivenessConverted =
    //       parseInt(elementalEffectiveness.toString()) / 100;
    //     logger.log(
    //       `Battle Log Damage Attacker Monster ID: ${attackerMonsterId} Defender Monster ID: ${defenderMonsterId} Move: ${translateMoveByAddress(
    //         move,
    //       )} Damage: ${damage} Elemental Effectiveness: ${elementalEffectivenessConverted} Is Critical: ${isCritical}`,
    //     );
    //   },
    // );

    eventLogger.on(
      "MatchLogEvent" as unknown as any,
      async (matchId: bigint, name: string, data: string[]) => {
        logger.log(
          `Match Log Event Match ID: ${matchId} Name: ${name} Data: ${data.join(
            ";",
          )}`,
        );

        if (name === "Commit") {
          logger.log(
            `${
              data[0] === selfAddress ? "You" : "Opponent"
            } committed move with hash = ${data[1]}`,
          );

          // Track the players that have committed their moves
          playersMovesCommitted.add(data[0]);

          // If both players have committed their moves
          if (playersMovesCommitted.size >= 2) {
            logger.log(`Revealing moves...`);
            playersMovesCommitted.clear();

            // clear status effects
            logger.log("Resetting status effects...");
            statusEffectsByMonsterId.set(firstMonsterId, []);
            statusEffectsByMonsterId.set(secondMonsterId, []);
            statusEffectsByMonsterId.set(firstOpponentMonsterId, []);
            statusEffectsByMonsterId.set(secondOpponentMonsterId, []);

            try {
              const matchMakerV2Fresh =
                await getContractInstance<MatchMakerV2>("MatchMakerV2");
              const tx = await matchMakerV2Fresh.reveal(
                matchId,
                lastAttack,
                ethers.encodeBytes32String("secret"),
                {
                  gasLimit: GAS_LIMIT,
                },
              );
              logger.log(`Reveal tx was ${tx.hash}`);
              await tx.wait();
            } catch (err: any) {
              logger.log(chalk.redBright(err.message));
            }
          }
        }
      },
    );
  });
}

let lastAttack = "";
let playersMovesCommitted = new Set<string>();
let playersMovesRevealed = new Set<string>();

async function runMatch() {
  // const { default: chalk } = await import("chalk");

  const matchMakerV2 = await getContractInstance<MatchMakerV2>("MatchMakerV2");

  matchMakerV2.on(
    "MoveCommitted" as unknown as any,
    async (matchId, player, commit) => {
      logger.log(
        `${
          player === selfAddress ? "You" : "Opponent"
        } committed move with hash = ${commit}`,
      );

      // Track the players that have committed their moves
      playersMovesCommitted.add(player);

      // If both players have committed their moves
      if (playersMovesCommitted.size >= 2) {
        logger.log(`Revealing moves...`);
        playersMovesCommitted.clear();

        // clear status effects
        logger.log("Resetting status effects...");
        statusEffectsByMonsterId.set(firstMonsterId, []);
        statusEffectsByMonsterId.set(secondMonsterId, []);
        statusEffectsByMonsterId.set(firstOpponentMonsterId, []);
        statusEffectsByMonsterId.set(secondOpponentMonsterId, []);

        try {
          const matchMakerV2Fresh =
            await getContractInstance<MatchMakerV2>("MatchMakerV2");
          const tx = await matchMakerV2Fresh.reveal(
            matchId,
            lastAttack,
            ethers.encodeBytes32String("secret"),
            {
              gasLimit: GAS_LIMIT,
            },
          );
          logger.log(`Reveal tx was ${tx.hash}`);
          await tx.wait();
        } catch (err: any) {
          logger.log(chalk.redBright(err.message));
        }
      }
    },
  );
}

async function startMatchmaking(selectedMonsters: string[]) {
  // const { default: chalk } = await import("chalk");

  const matchMakerV2 = await getContractInstance<MatchMakerV2>("MatchMakerV2");
  const [addressInQueue] = await matchMakerV2.queuedTeams(0);
  if (addressInQueue == ethers.ZeroAddress) {
    logger.log(`Waiting for another player...`);
  }

  logger.log(`Joining...`);
  try {
    const tx = await matchMakerV2.createAndJoin(
      0,
      selectedMonsters[0],
      selectedMonsters[1],
      {
        gasLimit: GAS_LIMIT,
      },
    );
    await tx.wait();
  } catch (err: any) {
    logger.log(chalk.redBright(err.message));
  }
}

async function createMonster(api: MonsterApiV1, monsterName: string) {
  const txResult = await api.createMonsterByName(
    monsterIds.get(monsterName) || BigInt(0),
  );
  return getMonsterIdFromTxReceipt(await txResult.wait());
}

function getMonsterIdFromTxReceipt(txReceipt: any) {
  const monsterCreatedLog = txReceipt?.logs?.find(
    (log: any) => log.fragment?.name === "MonsterCreated",
  );
  return monsterCreatedLog?.args[0];
}

async function main() {
  selfAddress = (await ethers.getSigners())[0].address;

  const matchMakerV2 = await getContractInstance<MatchMakerV2>("MatchMakerV2");
  setupEventListener(matchMakerV2);
  runMatch();

  const selectedMonsters = await promptManager.createPrompt(
    "multiSelect",
    "Choose 2 monsters:",
    monsters,
    2,
  );
  logger.log(`Selected monsters: ${selectedMonsters.join(", ")}`);
  startMatchmaking(selectedMonsters);
}

// Start the CLI application
main();
