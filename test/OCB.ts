import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import {
  EventLoggerV1,
  MatchMakerV3,
  MonsterApiV1,
  MoveExecutorV1,
} from "../typechain-types";
import { ContractFactory, Signer } from "ethers";
import { monster } from "../typechain-types/contracts/gameplay-v1/effects";
import { decodeEvent } from "./events";
import { createMockMonsters } from "./attacks/createMockMonsters";
import { deployAttacks } from "./attacks/deployAttacks";

const ONE_MINUTE = 60;

const getCommitHash = (move: string, secret: string = "secret") =>
  ethers.solidityPackedKeccak256(
    ["address", "bytes32"],
    [move, ethers.encodeBytes32String(secret)],
  );

describe("OCB", function () {
  async function deploy(useCommitReveal: boolean = true) {
    const signers = await ethers.getSigners();
    const [owner, account2, account3] = signers;

    const MoveExecutorV1 = await ethers.getContractFactory("MoveExecutorV1");
    const moveExecutorV1 = await MoveExecutorV1.deploy(
      await owner.getAddress(),
    );

    const UsernamesV1 = await ethers.getContractFactory("UsernamesV1");
    const userNamesV1 = await UsernamesV1.deploy(await owner.getAddress());

    const MonsterApiV1 = await ethers.getContractFactory("MonsterApiV1");
    const monsterApiV1 = await MonsterApiV1.deploy();

    const EventLoggerV1 = await ethers.getContractFactory("EventLoggerV1");
    const eventLogger = await EventLoggerV1.deploy(await owner.getAddress());

    const MatchMakerV3 = await ethers.getContractFactory("MatchMakerV3");
    const matchMakerV3 = await upgrades.deployProxy(MatchMakerV3 as any, [
      await monsterApiV1.getAddress(),
      await moveExecutorV1.getAddress(),
      await eventLogger.getAddress(),
    ]);

    const LeaderboardV1 = await ethers.getContractFactory("LeaderboardV1");
    const leaderboardV1 = await upgrades.deployProxy(LeaderboardV1 as any, [
      await matchMakerV3.getAddress(),
      await userNamesV1.getAddress(),
    ]);
    await matchMakerV3.setLeaderboard(await leaderboardV1.getAddress());

    const TimeoutMove = await ethers.getContractFactory("TimeoutMove");
    const timeoutMove = await TimeoutMove.deploy();
    await eventLogger.addWriter(await timeoutMove.getAddress());
    await timeoutMove.setLogger(await eventLogger.getAddress());
    await timeoutMove.addExecutor(await moveExecutorV1.getAddress());

    await (matchMakerV3 as unknown as MatchMakerV3).setMode(
      0,
      ONE_MINUTE,
      await timeoutMove.getAddress(),
      useCommitReveal,
    );
    await eventLogger.addWriter(await matchMakerV3.getAddress());

    await moveExecutorV1.grantRole(
      await moveExecutorV1.PERMITTED_ROLE(),
      await matchMakerV3.getAddress(),
    );

    await eventLogger.addWriter(await moveExecutorV1.getAddress());

    return {
      owner,
      account2,
      account3,
      eventLogger,
      matchMaker: matchMakerV3 as unknown as MatchMakerV3,
      monsterApiV1,
      moveExecutorV1,
      leaderboardV1,
    };
  }

  async function commit(
    matchMaker: MatchMakerV3,
    eventLogger: EventLoggerV1,
    user: Signer,
    matchId: number | bigint,
    move: string,
  ): Promise<any[]> {
    const tx = await matchMaker
      .connect(user)
      .commit(matchId, getCommitHash(move));
    const receipt = await tx.wait();
    return receipt!.logs.map((log) =>
      eventLogger.interface.parseLog(log as unknown as any),
    );
  }

  async function reveal(
    matchMaker: MatchMakerV3,
    eventLogger: EventLoggerV1,
    user: Signer,
    matchId: number | bigint,
    move: string,
  ): Promise<any[]> {
    const tx = await matchMaker
      .connect(user)
      .reveal(matchId, move, ethers.encodeBytes32String("secret"));
    const receipt = await tx.wait();
    return receipt!.logs.map((log: any) => eventLogger.interface.parseLog(log));
  }

  async function commitSingleAttack(
    matchMaker: MatchMakerV3,
    eventLogger: EventLoggerV1,
    user: Signer,
    matchId: number | bigint,
    move: string,
  ): Promise<any[]> {
    const events = [];

    events.push(
      ...(await commit(matchMaker, eventLogger, user, matchId, move)),
    );

    return events;
  }

  async function revealSingleAttack(
    matchMaker: MatchMakerV3,
    eventLogger: EventLoggerV1,
    user: Signer,
    matchId: number | bigint,
    move: string,
  ): Promise<any[]> {
    const events = [];

    events.push(
      ...(await reveal(matchMaker, eventLogger, user, matchId, move)),
    );

    return events;
  }

  async function runAttacks(
    matchMaker: MatchMakerV3,
    eventLogger: EventLoggerV1,
    player1: Signer,
    player2: Signer,
    matchId: number | bigint,
    move1: string,
    move2?: string,
    useCommitReveal: boolean = true,
  ): Promise<any[]> {
    const events = [];

    if (useCommitReveal) {
      events.push(
        ...(await commit(matchMaker, eventLogger, player1, matchId, move1)),
      );
      if (move2) {
        events.push(
          ...(await commit(matchMaker, eventLogger, player2, matchId, move2)),
        );
      }
    }

    events.push(
      ...(await reveal(matchMaker, eventLogger, player1, matchId, move1)),
    );
    if (move2) {
      events.push(
        ...(await reveal(matchMaker, eventLogger, player2, matchId, move2)),
      );
    }

    return events;
  }

  describe("V1", function () {
    it("should deploy", async function () {
      const { matchMaker, monsterApiV1, moveExecutorV1 } = await deploy();
      expect(await matchMaker.getAddress()).to.not.equal(0);
      expect(await moveExecutorV1.getAddress()).to.not.equal(0);
      expect(await monsterApiV1.getAddress()).to.not.equal(0);
    });

    it("should allow creating mock monsters", async function () {
      const { monsterApiV1 } = await deploy();

      await createMockMonsters(monsterApiV1);
    });

    it("should should decrease the strength of defense auras", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        matchMaker,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

      expect(await matchMaker.matchCount()).to.equal(BigInt(1));

      const { defenseAuraMove } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      const matchId = 1;

      const logs = await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await defenseAuraMove.getAddress(),
        await defenseAuraMove.getAddress(),
      );

      const decodedLogs = logs.map((log) =>
        decodeEvent(log.args[0], log.args[2], log.args[3], log.args[4]),
      );

      const defenseAuraEvents = decodedLogs.filter(
        (event) => event?.name === "ApplyMonsterStatusEffectLog",
      );

      expect(defenseAuraEvents.length).to.equal(2);
      for (const event of defenseAuraEvents) {
        expect(event?.extraData).to.equal(BigInt(20));
      }

      const moreLogs = await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await defenseAuraMove.getAddress(),
        await defenseAuraMove.getAddress(),
      );

      const moreDecodedLogs = moreLogs.map((log) =>
        decodeEvent(log.args[0], log.args[2], log.args[3], log.args[4]),
      );

      const moreDefenseAuraEvents = moreDecodedLogs.filter(
        (event) => event?.name === "ApplyMonsterStatusEffectLog",
      );

      expect(moreDefenseAuraEvents.length).to.equal(2);
      for (const event of moreDefenseAuraEvents) {
        expect(event?.extraData).to.equal(BigInt(10));
      }
    });

    it("should allow both players to apply a speed boost", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        matchMaker,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(0, "7", "8"); // join with water and nature

      expect(await matchMaker.matchCount()).to.equal(BigInt(1));

      const { speedAuraMove } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      const matchId = 1;

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await speedAuraMove.getAddress(),
        await speedAuraMove.getAddress(),
      );

      // boost should not be persisted
      const monster1 = await matchMaker.monsters(1);
      expect(monster1.speed).to.equal(BigInt(120));

      const monster2 = await matchMaker.monsters(3);
      expect(monster2.speed).to.equal(BigInt(125));

      const statusEffectsMonster1 = await matchMaker.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(1);

      const statusEffectsMonster2 = await matchMaker.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(1);
    });

    it("should allow both players to apply a heal (even if makes no sense)", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        matchMaker,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(0, "7", "8"); // join with water and nature

      expect(await matchMaker.matchCount()).to.equal(BigInt(1));

      const { healMove, purgeBuffsMove } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      const matchId = 1;

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await healMove.getAddress(),
        await healMove.getAddress(),
      );

      // hp should not be higher than initial hp
      let monster1 = await matchMaker.monsters(1);
      expect(monster1.hp).to.equal(BigInt(120));

      let monster2 = await matchMaker.monsters(3);
      expect(monster2.hp).to.equal(BigInt(125));

      const statusEffectsMonster1 = await matchMaker.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(0);

      const statusEffectsMonster2 = await matchMaker.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(0);

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await purgeBuffsMove.getAddress(),
        await purgeBuffsMove.getAddress(),
      );

      // monsters should have lost hp
      monster1 = await matchMaker.monsters(1);
      // @todo this assertion is currently sometimes flaky :(
      expect(monster1.hp).to.equal(BigInt(87));

      monster2 = await matchMaker.monsters(3);
      expect(monster2.hp).to.equal(BigInt(84));

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await healMove.getAddress(),
        await healMove.getAddress(),
      );

      // monsters should only have gained 20 hp on second heal
      monster1 = await matchMaker.monsters(1);
      expect(monster1.hp).to.equal(BigInt(107));

      monster2 = await matchMaker.monsters(3);
      expect(monster2.hp).to.equal(BigInt(104));
    });

    it("should destroy a cloud cover with purge buffs", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        matchMaker,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

      expect(await matchMaker.matchCount()).to.equal(BigInt(1));

      const { cloudCoverMove, purgeBuffsMove } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      const matchId = 1;

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await purgeBuffsMove.getAddress(),
      );

      const statusEffectsMonster1 = await matchMaker.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(0);

      const statusEffectsMonster2 = await matchMaker.getStatusEffectsArray(4);
      expect(statusEffectsMonster2.length).to.equal(0);
    });

    it("should allow both players to apply a cloud cover", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        matchMaker,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

      expect(await matchMaker.matchCount()).to.equal(BigInt(1));

      const { cloudCoverMove } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      const matchId = 1;

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await cloudCoverMove.getAddress(),
      );

      const statusEffectsMonster1 = await matchMaker.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(1);

      const statusEffectsMonster2 = await matchMaker.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(1);
    });

    it("should allow basic gameplay", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        matchMaker,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

      expect(await matchMaker.matchCount()).to.equal(BigInt(1));

      const { damageOverTimeAttack } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      const matchId = 1;

      while (true) {
        try {
          await runAttacks(
            matchMaker,
            eventLogger,
            account2,
            account3,
            matchId,
            await damageOverTimeAttack.getAddress(),
            await damageOverTimeAttack.getAddress(),
          );
        } catch (e: any) {
          if (e.message.includes("MatchMakerV3: game over")) {
            break;
          }
          throw e;
        }
      }

      // battle done!
      expect(true).to.equal(true);
    });

    it("should execute heal before damage", async () => {
      const {
        owner,
        account2,
        account3,
        matchMaker,
        monsterApiV1,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

      const matchId = await matchMaker.matchCount();

      const { healMove, damageOverTimeAttack, speedAuraMove, cloudCoverMove } =
        await deployAttacks(owner, eventLogger, moveExecutorV1);

      // lets run a speed aura first to make player 2 faster than player 1
      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await speedAuraMove.getAddress(),
      );

      const attackResults = await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await healMove.getAddress(),
        await damageOverTimeAttack.getAddress(),
      );

      const healEventIndex = attackResults.findIndex(
        (event) => event?.args[2] === BigInt(6),
      );

      const damageEventIndex = attackResults.findIndex(
        (event) => event?.args[2] === BigInt(5),
      );

      expect(healEventIndex).to.be.lessThan(damageEventIndex);
    });

    it("should support attack auras", async () => {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        matchMaker,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      const {
        cloudCoverEffect,
        purgeBuffsMove,
        cloudCoverMove,
        attackAuraMove,
        speedAuraMove,
        damageOverTimeAttack,
        speedAuraEffect,
        damageOverTimeEffect,
        controlMove,
        elementalWallEffect,
        elementalWallMove,
      } = await deployAttacks(owner, eventLogger, moveExecutorV1);

      await cloudCoverEffect.setChance(100);

      await matchMaker.connect(account2).createAndJoin(0, "19", "9"); // Fernopig + Wavepaw
      await matchMaker.connect(account3).createAndJoin(0, "9", "19"); // Fernopig + Wavepaw

      let [, , monster1Hp, , , speed1] = await matchMaker.monsters(1);
      let [, , monster2Hp, , , speed2] = await matchMaker.monsters(3);

      expect(monster1Hp).to.equal(BigInt(120));
      expect(monster2Hp).to.equal(BigInt(125));
      expect(speed1).to.equal(BigInt(140));
      expect(speed2).to.equal(BigInt(125));

      const matchId = 1;

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await attackAuraMove.getAddress(),
        await speedAuraMove.getAddress(),
      );

      let statusEffectsMonster1 = await matchMaker.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(1);

      let statusEffectsMonster2 = await matchMaker.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(1);

      // no damage yet
      [, , monster1Hp] = await matchMaker.monsters(1);
      [, , monster2Hp] = await matchMaker.monsters(3);
      expect(monster1Hp).to.equal(BigInt(120));
      expect(monster2Hp).to.equal(BigInt(125));

      // attack with the player who has the attack aura
      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await purgeBuffsMove.getAddress(),
        await speedAuraMove.getAddress(),
      );

      // damage caused (extra 20 from attack aura)
      [, , monster1Hp] = await matchMaker.monsters(1);
      [, , monster2Hp] = await matchMaker.monsters(3);
      expect(monster1Hp).to.equal(BigInt(120));
      expect(monster2Hp).to.equal(BigInt(57));
    });

    it("should have issues fixed that occured in a battle on 2024-02-13", async () => {
      const {
        owner,
        account2,
        account3,
        matchMaker,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      const {
        cloudCoverEffect,
        purgeBuffsMove,
        cloudCoverMove,
        speedAuraMove,
        damageOverTimeAttack,
        speedAuraEffect,
        damageOverTimeEffect,
        controlMove,
        elementalWallEffect,
        elementalWallMove,
        tailwindMove,
        cleansingShieldMove,
        attackAuraMove,
        wallBreakerMove,
      } = await deployAttacks(owner, eventLogger, moveExecutorV1);

      await matchMaker.connect(account2).createAndJoin(0, "33", "25"); // Aquarump + Firizard
      await matchMaker.connect(account3).createAndJoin(0, "28", "56"); // Chargecrest + Terraform

      let [, , monster1Hp, , , speed1] = await matchMaker.monsters(1);
      let [, , monster2Hp, , , speed2] = await matchMaker.monsters(2);
      let [, , monster3Hp, , , speed3] = await matchMaker.monsters(3);
      let [, , monster4Hp, , , speed4] = await matchMaker.monsters(4);

      expect(monster1Hp).to.equal(BigInt(130));
      expect(monster2Hp).to.equal(BigInt(120));
      expect(monster3Hp).to.equal(BigInt(120));
      expect(monster4Hp).to.equal(BigInt(130));

      expect(speed1).to.equal(BigInt(110));
      expect(speed2).to.equal(BigInt(130));
      expect(speed3).to.equal(BigInt(130));
      expect(speed4).to.equal(BigInt(110));

      const matchId = 1;

      await damageOverTimeAttack.setChance(0);

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await damageOverTimeAttack.getAddress(),
        await tailwindMove.getAddress(),
      );

      [, , monster1Hp] = await matchMaker.monsters(1);
      // no damage
      expect(monster1Hp).to.equal(BigInt(130));
      await damageOverTimeAttack.setChance(100);
      await damageOverTimeAttack.setCriticalHitDisabled(true);

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await cleansingShieldMove.getAddress(),
        await damageOverTimeAttack.getAddress(),
      );

      [, , monster1Hp] = await matchMaker.monsters(1);
      // 40 damage from attack + 8 from damage over time
      expect(monster1Hp).to.equal(BigInt(82));

      await cloudCoverEffect.setChance(0);
      await damageOverTimeAttack.setChance(0);
      await damageOverTimeAttack.setCriticalHitEnforced(true);

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await damageOverTimeAttack.getAddress(),
      );

      [, , monster1Hp] = await matchMaker.monsters(1);
      // 60 damage from attack (critical) + 8 from damage over time
      expect(monster1Hp).to.equal(BigInt(14));

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await attackAuraMove.getAddress(),
        await tailwindMove.getAddress(),
      );

      [, , monster1Hp] = await matchMaker.monsters(1);
      // same hp
      expect(monster1Hp).to.equal(BigInt(14));

      await wallBreakerMove.setChance(0);
      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await wallBreakerMove.getAddress(),
      );

      [, , monster1Hp] = await matchMaker.monsters(1);
      // defeated
      expect(monster1Hp).to.equal(BigInt(0));

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await wallBreakerMove.getAddress(),
      );
    });

    it("should have issues fixed that occured in a battle on 2023-10-20", async () => {
      const {
        owner,
        account2,
        account3,
        matchMaker,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      const {
        cloudCoverEffect,
        purgeBuffsMove,
        cloudCoverMove,
        speedAuraMove,
        damageOverTimeAttack,
        speedAuraEffect,
        damageOverTimeEffect,
        controlMove,
        elementalWallEffect,
        elementalWallMove,
      } = await deployAttacks(owner, eventLogger, moveExecutorV1);

      await cloudCoverEffect.setChance(100);

      await matchMaker.connect(account2).createAndJoin(0, "19", "9"); // Fernopig + Wavepaw
      await matchMaker.connect(account3).createAndJoin(0, "9", "19"); // Fernopig + Wavepaw

      let [, , monster1Hp, , , speed1] = await matchMaker.monsters(1);
      let [, , monster2Hp, , , speed2] = await matchMaker.monsters(3);

      expect(monster1Hp).to.equal(BigInt(120));
      expect(monster2Hp).to.equal(BigInt(125));
      expect(speed1).to.equal(BigInt(140));
      expect(speed2).to.equal(BigInt(125));

      const matchId = 1;

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await purgeBuffsMove.getAddress(),
        await cloudCoverMove.getAddress(),
      );

      let statusEffectsMonster1 = await matchMaker.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(0);

      let statusEffectsMonster2 = await matchMaker.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(1);
      expect(statusEffectsMonster2[0][0]).to.equal(
        await cloudCoverEffect.getAddress(),
      );
      expect(statusEffectsMonster2[0][1]).to.equal(
        BigInt(2), // turns left
      );

      // no damage yet
      [, , monster1Hp] = await matchMaker.monsters(1);
      [, , monster2Hp] = await matchMaker.monsters(3);
      expect(monster1Hp).to.equal(BigInt(120));
      expect(monster2Hp).to.equal(BigInt(125));

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await speedAuraMove.getAddress(),
      );

      // no damage yet
      [, , monster1Hp] = await matchMaker.monsters(1);
      [, , monster2Hp] = await matchMaker.monsters(3);
      expect(monster1Hp).to.equal(BigInt(120));
      expect(monster2Hp).to.equal(BigInt(125));

      statusEffectsMonster1 = await matchMaker.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(1);
      expect(statusEffectsMonster1[0][0]).to.equal(
        await cloudCoverEffect.getAddress(),
      );
      expect(statusEffectsMonster1[0][1]).to.equal(
        BigInt(2), // turns left
      );

      statusEffectsMonster2 = await matchMaker.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(2);
      expect(statusEffectsMonster2[0][0]).to.equal(
        await cloudCoverEffect.getAddress(),
      );
      expect(statusEffectsMonster2[0][1]).to.equal(
        BigInt(1), // turns left
      );
      expect(statusEffectsMonster2[1][0]).to.equal(
        await speedAuraEffect.getAddress(),
      );
      expect(statusEffectsMonster2[1][1]).to.equal(
        BigInt(254), // turns left
      );

      await cloudCoverEffect.setChance(0);

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await speedAuraMove.getAddress(),
        await damageOverTimeAttack.getAddress(),
      );

      // big damage
      [, , monster1Hp] = await matchMaker.monsters(1);
      [, , monster2Hp] = await matchMaker.monsters(3);
      expect(monster1Hp).to.equal(BigInt(12));
      expect(monster2Hp).to.equal(BigInt(125));

      statusEffectsMonster1 = await matchMaker.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(3);
      expect(statusEffectsMonster1[0][0]).to.equal(
        await cloudCoverEffect.getAddress(),
      );
      expect(statusEffectsMonster1[0][1]).to.equal(
        BigInt(1), // turns left
      );
      expect(statusEffectsMonster1[1][0]).to.equal(
        await speedAuraEffect.getAddress(),
      );
      expect(statusEffectsMonster1[1][1]).to.equal(
        BigInt(254), // turns left
      );
      expect(statusEffectsMonster1[2][0]).to.equal(
        await damageOverTimeEffect.getAddress(),
      );

      statusEffectsMonster2 = await matchMaker.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(1);
      expect(statusEffectsMonster2[0][0]).to.equal(
        await speedAuraEffect.getAddress(),
      );
      expect(statusEffectsMonster2[0][1]).to.equal(
        BigInt(253), // turns left
      );

      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await controlMove.getAddress(),
        await elementalWallMove.getAddress(),
      );

      // first monster killed
      [, , monster1Hp] = await matchMaker.monsters(1);
      [, , monster2Hp] = await matchMaker.monsters(3);
      expect(monster1Hp).to.equal(BigInt(0));
      expect(monster2Hp).to.equal(BigInt(125));

      statusEffectsMonster2 = await matchMaker.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(2);
      expect(statusEffectsMonster2[0][0]).to.equal(
        await speedAuraEffect.getAddress(),
      );
      expect(statusEffectsMonster2[0][1]).to.equal(
        BigInt(252), // turns left
      );
      expect(statusEffectsMonster2[1][0]).to.equal(
        await elementalWallEffect.getAddress(),
      );
      expect(statusEffectsMonster2[1][1]).to.equal(
        BigInt(2), // turns left
      );
    });
  });

  it("should store events", async () => {
    const {
      owner,
      account2,
      account3,
      matchMaker,
      monsterApiV1,
      eventLogger,
      moveExecutorV1,
    } = await deploy();

    await createMockMonsters(monsterApiV1);

    await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
    await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

    const matchId = await matchMaker.matchCount();

    const { damageOverTimeAttack, damageOverTimeEffect } = await deployAttacks(
      owner,
      eventLogger,
      moveExecutorV1,
    );

    await runAttacks(
      matchMaker,
      eventLogger,
      account2,
      account3,
      matchId,
      await damageOverTimeAttack.getAddress(),
      await damageOverTimeAttack.getAddress(),
    );

    const events = await eventLogger.getLogs(matchId, BigInt(0));

    expect(events.length).to.equal(10);
  });

  it("should return active status effects in the MatchView", async () => {
    const {
      owner,
      account2,
      account3,
      matchMaker,
      monsterApiV1,
      eventLogger,
      moveExecutorV1,
    } = await deploy();

    await createMockMonsters(monsterApiV1);

    await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
    await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

    const matchId = await matchMaker.matchCount();

    const { cloudCoverMove } = await deployAttacks(
      owner,
      eventLogger,
      moveExecutorV1,
    );

    await runAttacks(
      matchMaker,
      eventLogger,
      account2,
      account3,
      matchId,
      await cloudCoverMove.getAddress(),
      await cloudCoverMove.getAddress(),
    );

    const match = await matchMaker.getMatchByUser(account2.getAddress());
    expect(match[0]).to.equal(matchId);
  });

  it("should allow support timeouts", async () => {
    const {
      owner,
      account2,
      account3,
      matchMaker,
      monsterApiV1,
      eventLogger,
      moveExecutorV1,
    } = await deploy();

    await createMockMonsters(monsterApiV1);

    await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
    await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

    const matchId = await matchMaker.matchCount();

    const { damageOverTimeAttack } = await deployAttacks(
      owner,
      eventLogger,
      moveExecutorV1,
    );

    await commitSingleAttack(
      matchMaker,
      eventLogger,
      account2,
      matchId,
      await damageOverTimeAttack.getAddress(),
    );

    // let the timeout expire
    await ethers.provider.send("evm_increaseTime", [ONE_MINUTE + 1]);
    await ethers.provider.send("evm_mine", []);

    await matchMaker.goToRevealPhase(matchId);
    const events = await revealSingleAttack(
      matchMaker,
      eventLogger,
      account2,
      matchId,
      await damageOverTimeAttack.getAddress(),
    );

    // expect logs to contain the timeout reveal
    const revealedMoves = events.filter(
      (event) =>
        event?.name === "LogEvent" && event?.args[2] === BigInt(1_000_001),
    );

    expect(revealedMoves.length).to.equal(2);

    // next we should also check that the reveal is actually a timeout move
  });

  it("should count wins in leaderboard", async () => {
    const {
      owner,
      account2,
      account3,
      matchMaker,
      monsterApiV1,
      eventLogger,
      moveExecutorV1,
      leaderboardV1,
    } = await deploy();

    await createMockMonsters(monsterApiV1);

    await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
    await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

    const matchId = await matchMaker.matchCount();

    const { damageOverTimeAttack } = await deployAttacks(
      owner,
      eventLogger,
      moveExecutorV1,
    );

    // battle until game over
    for (let i = 0; i < 10; i++) {
      try {
        await commitSingleAttack(
          matchMaker,
          eventLogger,
          account2,
          matchId,
          await damageOverTimeAttack.getAddress(),
        );

        // let the timeout expire
        await ethers.provider.send("evm_increaseTime", [ONE_MINUTE + 1]);
        await ethers.provider.send("evm_mine", []);

        await matchMaker.goToRevealPhase(matchId);
        await revealSingleAttack(
          matchMaker,
          eventLogger,
          account2,
          matchId,
          await damageOverTimeAttack.getAddress(),
        );
      } catch (err: any) {
        if (err.message.includes("MatchMakerV3: game over")) {
          break;
        }

        throw err;
      }
    }

    const playerStatsWinner = await leaderboardV1.playerStats(
      await account2.getAddress(),
    );
    expect(playerStatsWinner.wins).to.equal(BigInt(1));
    const playerStatsLoser = await leaderboardV1.playerStats(
      await account3.getAddress(),
    );
    expect(playerStatsLoser.losses).to.equal(BigInt(1));

    const playerCount = await leaderboardV1.getPlayerCount();
    expect(playerCount).to.equal(BigInt(2));

    const allStats = await leaderboardV1.getAllStats(0);
    expect(allStats.length).to.equal(2);
  });

  it("should work without commits", async () => {
    const {
      owner,
      account2,
      account3,
      matchMaker,
      monsterApiV1,
      eventLogger,
      moveExecutorV1,
      leaderboardV1,
    } = await deploy(false);

    await createMockMonsters(monsterApiV1);

    await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
    await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

    const matchId = await matchMaker.matchCount();
    let match = await matchMaker.getMatchByUser(account2.getAddress());
    // round should be 0
    expect(match[1][6]).to.equal(BigInt(0));

    const { damageOverTimeAttack, cloudCoverMove } = await deployAttacks(
      owner,
      eventLogger,
      moveExecutorV1,
    );

    await runAttacks(
      matchMaker,
      eventLogger,
      account2,
      account3,
      matchId,
      await damageOverTimeAttack.getAddress(),
      await cloudCoverMove.getAddress(),
      false,
    );

    match = await matchMaker.getMatchByUser(account2.getAddress());
    // round should now be 1 and not zero anymore
    expect(match[1][6]).to.equal(BigInt(1));
  });

  it("should not without commits if the setting isn't applied", async () => {
    const {
      owner,
      account2,
      account3,
      matchMaker,
      monsterApiV1,
      eventLogger,
      moveExecutorV1,
    } = await deploy(true);

    await createMockMonsters(monsterApiV1);

    await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
    await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

    const matchId = await matchMaker.matchCount();
    let match = await matchMaker.getMatchByUser(account2.getAddress());
    // round should be 0
    expect(match[1][6]).to.equal(BigInt(0));

    const { damageOverTimeAttack, cloudCoverMove } = await deployAttacks(
      owner,
      eventLogger,
      moveExecutorV1,
    );

    let errorThrown = false;
    try {
      await runAttacks(
        matchMaker,
        eventLogger,
        account2,
        account3,
        matchId,
        await damageOverTimeAttack.getAddress(),
        await cloudCoverMove.getAddress(),
        false,
      );
    } catch (err) {
      expect((err as Error).message).to.contain(
        "MatchMakerV3: not in reveal phase",
      );
      errorThrown = true;
    }

    expect(errorThrown).to.be.true;
  });
});
