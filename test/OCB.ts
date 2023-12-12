import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import {
  EventLoggerV1,
  MatchMakerV2,
  MonsterApiV1,
  MoveExecutorV1,
} from "../typechain-types";
import { Signer } from "ethers";
import { decodeAbiParameters } from "viem";
import { move } from "../typechain-types/contracts/gameplay-v1/effects";

const ONE_MINUTE = 60;

const ELEMENTS = {
  ELECTRIC: 1,
  FIRE: 2,
  WATER: 3,
  MENTAL: 4,
  NATURE: 5,
  TOXIC: 6,
};

const getCommitHash = (move: string, secret: string = "secret") =>
  ethers.solidityPackedKeccak256(
    ["address", "bytes32"],
    [move, ethers.encodeBytes32String(secret)],
  );

describe("OCB", function () {
  async function deploy() {
    const signers = await ethers.getSigners();
    const [owner, account2, account3] = signers;

    const MoveExecutorV1 = await ethers.getContractFactory("MoveExecutorV1");
    const moveExecutorV1 = await MoveExecutorV1.deploy(
      await owner.getAddress(),
    );

    const MonsterApiV1 = await ethers.getContractFactory("MonsterApiV1");
    const monsterApiV1 = await MonsterApiV1.deploy();

    const EventLoggerV1 = await ethers.getContractFactory("EventLoggerV1");
    const eventLogger = await EventLoggerV1.deploy(await owner.getAddress());

    const MatchMakerV2 = await ethers.getContractFactory("MatchMakerV2");
    const matchMakerV2 = await upgrades.deployProxy(MatchMakerV2, [
      await monsterApiV1.getAddress(),
      await moveExecutorV1.getAddress(),
      await eventLogger.getAddress(),
      ONE_MINUTE,
    ]);

    await eventLogger.addWriter(await matchMakerV2.getAddress());

    await moveExecutorV1.grantRole(
      await moveExecutorV1.PERMITTED_ROLE(),
      await matchMakerV2.getAddress(),
    );

    await eventLogger.addWriter(await moveExecutorV1.getAddress());

    return {
      account2,
      account3,
      eventLogger,
      matchMakerV2: matchMakerV2 as unknown as MatchMakerV2,
      monsterApiV1,
      moveExecutorV1,
    };
  }

  async function deployAttacks(
    logger: EventLoggerV1,
    moveExecutorV1: MoveExecutorV1,
  ) {
    const DamageOverTimeEffect = await ethers.getContractFactory(
      "DamageOverTimeEffect",
    );
    const damageOverTimeEffect = await DamageOverTimeEffect.deploy();
    await damageOverTimeEffect.setLogger(await logger.getAddress());
    await logger.addWriter(await damageOverTimeEffect.getAddress());

    const DamageOverTimeMove =
      await ethers.getContractFactory("DamageOverTimeMove");
    const damageOverTimeMove = await DamageOverTimeMove.deploy(
      await damageOverTimeEffect.getAddress(),
      100,
    );
    await damageOverTimeMove.setLogger(await logger.getAddress());
    await damageOverTimeMove.setExecutor(await moveExecutorV1.getAddress());
    await logger.addWriter(await damageOverTimeMove.getAddress());

    const FoggedEffect = await ethers.getContractFactory("FoggedEffect");
    const foggedEffect = await FoggedEffect.deploy();
    await foggedEffect.setLogger(await logger.getAddress());
    await logger.addWriter(await foggedEffect.getAddress());

    const ControlMove = await ethers.getContractFactory("ControlMove");
    const controlMove = await ControlMove.deploy(
      await foggedEffect.getAddress(),
    );
    await controlMove.setLogger(await logger.getAddress());
    await controlMove.setExecutor(await moveExecutorV1.getAddress());
    await logger.addWriter(await controlMove.getAddress());

    const CloudCoverEffect =
      await ethers.getContractFactory("CloudCoverEffect");
    const cloudCoverEffect = await CloudCoverEffect.deploy(0);
    await cloudCoverEffect.setLogger(await logger.getAddress());
    await logger.addWriter(await cloudCoverEffect.getAddress());

    const CloudCoverMove = await ethers.getContractFactory("CloudCoverMove");
    const cloudCoverMove = await CloudCoverMove.deploy(
      await cloudCoverEffect.getAddress(),
    );
    await cloudCoverMove.setLogger(await logger.getAddress());
    await cloudCoverMove.setExecutor(await moveExecutorV1.getAddress());
    await logger.addWriter(await cloudCoverMove.getAddress());

    const SpeedAuraEffect = await ethers.getContractFactory("SpeedAuraEffect");
    const speedAuraEffect = await SpeedAuraEffect.deploy();
    await speedAuraEffect.setLogger(await logger.getAddress());
    await logger.addWriter(await speedAuraEffect.getAddress());

    const SpeedAuraMove = await ethers.getContractFactory("SpeedAuraMove");
    const speedAuraMove = await SpeedAuraMove.deploy(
      await speedAuraEffect.getAddress(),
    );
    await speedAuraMove.setLogger(await logger.getAddress());
    await speedAuraMove.setExecutor(await moveExecutorV1.getAddress());
    await logger.addWriter(await speedAuraMove.getAddress());

    const HealMove = await ethers.getContractFactory("HealMove");
    const healMove = await HealMove.deploy();
    await healMove.setLogger(await logger.getAddress());
    await healMove.setExecutor(await moveExecutorV1.getAddress());
    await logger.addWriter(await healMove.getAddress());

    const PurgeBuffsMove = await ethers.getContractFactory("PurgeBuffsMove");
    const purgeBuffsMove = await PurgeBuffsMove.deploy(100);
    await purgeBuffsMove.setLogger(await logger.getAddress());
    await purgeBuffsMove.setExecutor(await moveExecutorV1.getAddress());
    await logger.addWriter(await purgeBuffsMove.getAddress());

    const ConfusedEffect = await ethers.getContractFactory("ConfusedEffect");
    const confusedEffect = await ConfusedEffect.deploy();
    await confusedEffect.setLogger(await logger.getAddress());
    await logger.addWriter(await confusedEffect.getAddress());

    const WallBreakerMove = await ethers.getContractFactory("WallBreakerMove");
    const wallBreakerMove = await WallBreakerMove.deploy(
      await confusedEffect.getAddress(),
    );
    await wallBreakerMove.setLogger(await logger.getAddress());
    await wallBreakerMove.setExecutor(await moveExecutorV1.getAddress());
    await logger.addWriter(await wallBreakerMove.getAddress());

    const ElementalWallEffect = await ethers.getContractFactory(
      "ElementalWallEffect",
    );
    const elementalWallEffect = await ElementalWallEffect.deploy(
      await wallBreakerMove.getAddress(),
    );
    await elementalWallEffect.setLogger(await logger.getAddress());
    await logger.addWriter(await elementalWallEffect.getAddress());

    const ElementalWallMove =
      await ethers.getContractFactory("ElementalWallMove");
    const elementalWallMove = await ElementalWallMove.deploy(
      await elementalWallEffect.getAddress(),
    );
    await elementalWallMove.setLogger(await logger.getAddress());
    await elementalWallMove.setExecutor(await moveExecutorV1.getAddress());
    await logger.addWriter(await elementalWallMove.getAddress());

    return {
      damageOverTimeAttack: damageOverTimeMove,
      cloudCoverMove: cloudCoverMove,
      speedAuraMove: speedAuraMove,
      controlEffect: foggedEffect,
      cloudCoverEffect,
      healMove,
      purgeBuffsMove,
      speedAuraEffect,
      damageOverTimeEffect,
      controlMove,
      wallBreakerMove,
      elementalWallEffect,
      elementalWallMove,
    };
  }

  async function createMockMonsters(monsterApi: MonsterApiV1) {
    // two of each type
    for (const id of ["1", "2"]) {
      await monsterApi.createMonster(id, ELEMENTS.FIRE, 100, 100, 100, 100, id);
    }

    for (const id of ["3", "4"]) {
      await monsterApi.createMonster(
        id,
        ELEMENTS.WATER,
        100,
        100,
        100,
        100,
        id,
      );
    }

    for (const id of ["5", "6"]) {
      await monsterApi.createMonster(
        id,
        ELEMENTS.NATURE,
        100,
        100,
        100,
        100,
        id,
      );
    }
  }

  async function commit(
    matchMakerV2: MatchMakerV2,
    eventLogger: EventLoggerV1,
    user: Signer,
    matchId: number | bigint,
    move: string,
  ): Promise<any[]> {
    const tx = await matchMakerV2
      .connect(user)
      .commit(matchId, getCommitHash(move));
    const receipt = await tx.wait();
    return receipt!.logs.map((log) =>
      eventLogger.interface.parseLog(log as unknown as any),
    );
  }

  async function reveal(
    matchMakerV2: MatchMakerV2,
    eventLogger: EventLoggerV1,
    user: Signer,
    matchId: number | bigint,
    move: string,
  ): Promise<any[]> {
    const tx = await matchMakerV2
      .connect(user)
      .reveal(matchId, move, ethers.encodeBytes32String("secret"));
    const receipt = await tx.wait();
    return receipt!.logs.map((log) =>
      eventLogger.interface.parseLog(log as unknown as any),
    );
  }

  async function runAttacks(
    matchMakerV2: MatchMakerV2,
    eventLogger: EventLoggerV1,
    player1: Signer,
    player2: Signer,
    matchId: number | bigint,
    move1: string,
    move2: string,
  ): Promise<any[]> {
    const events = [];

    events.push(
      ...(await commit(matchMakerV2, eventLogger, player1, matchId, move1)),
    );
    events.push(
      ...(await commit(matchMakerV2, eventLogger, player2, matchId, move2)),
    );

    events.push(
      ...(await reveal(matchMakerV2, eventLogger, player1, matchId, move1)),
    );
    events.push(
      ...(await reveal(matchMakerV2, eventLogger, player2, matchId, move2)),
    );

    return events;
  }

  describe("V1", function () {
    it("should deploy", async function () {
      const { matchMakerV2, monsterApiV1, moveExecutorV1 } = await deploy();
      expect(await matchMakerV2.getAddress()).to.not.equal(0);
      expect(await moveExecutorV1.getAddress()).to.not.equal(0);
      expect(await monsterApiV1.getAddress()).to.not.equal(0);
    });

    it("should allow creating mock monsters", async function () {
      const { monsterApiV1 } = await deploy();

      await createMockMonsters(monsterApiV1);
    });

    it("should allow both players to apply a speed boost", async function () {
      const {
        account2,
        account3,
        monsterApiV1,
        matchMakerV2,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMakerV2.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMakerV2.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

      expect(await matchMakerV2.matchCount()).to.equal(BigInt(1));

      const { speedAuraMove } = await deployAttacks(
        eventLogger,
        moveExecutorV1,
      );

      const matchId = 1;

      await runAttacks(
        matchMakerV2,
        eventLogger,
        account2,
        account3,
        matchId,
        await speedAuraMove.getAddress(),
        await speedAuraMove.getAddress(),
      );

      // boost should not be persisted
      const monster1 = await matchMakerV2.monsters(1);
      expect(monster1.speed).to.equal(BigInt(120));

      const monster2 = await matchMakerV2.monsters(3);
      expect(monster2.speed).to.equal(BigInt(125));

      const statusEffectsMonster1 = await matchMakerV2.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(1);

      const statusEffectsMonster2 = await matchMakerV2.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(1);
    });

    it("should allow both players to apply a heal (even if makes no sense)", async function () {
      const {
        account2,
        account3,
        monsterApiV1,
        matchMakerV2,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMakerV2.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMakerV2.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

      expect(await matchMakerV2.matchCount()).to.equal(BigInt(1));

      const { healMove } = await deployAttacks(eventLogger, moveExecutorV1);

      const matchId = 1;

      await runAttacks(
        matchMakerV2,
        eventLogger,
        account2,
        account3,
        matchId,
        await healMove.getAddress(),
        await healMove.getAddress(),
      );

      // hp should not be higher than initial hp
      const monster1 = await matchMakerV2.monsters(1);
      expect(monster1.hp).to.equal(BigInt(120));

      const monster2 = await matchMakerV2.monsters(3);
      expect(monster2.hp).to.equal(BigInt(125));

      const statusEffectsMonster1 = await matchMakerV2.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(0);

      const statusEffectsMonster2 = await matchMakerV2.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(0);
    });

    it("should destroy a cloud cover with purge buffs", async function () {
      const {
        account2,
        account3,
        monsterApiV1,
        matchMakerV2,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMakerV2.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMakerV2.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

      expect(await matchMakerV2.matchCount()).to.equal(BigInt(1));

      const { cloudCoverMove, purgeBuffsMove } = await deployAttacks(
        eventLogger,
        moveExecutorV1,
      );

      const matchId = 1;

      await runAttacks(
        matchMakerV2,
        eventLogger,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await purgeBuffsMove.getAddress(),
      );

      const statusEffectsMonster1 = await matchMakerV2.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(0);

      const statusEffectsMonster2 = await matchMakerV2.getStatusEffectsArray(4);
      expect(statusEffectsMonster2.length).to.equal(0);
    });

    it("should allow both players to apply a cloud cover", async function () {
      const {
        account2,
        account3,
        monsterApiV1,
        matchMakerV2,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMakerV2.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMakerV2.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

      expect(await matchMakerV2.matchCount()).to.equal(BigInt(1));

      const { cloudCoverMove } = await deployAttacks(
        eventLogger,
        moveExecutorV1,
      );

      const matchId = 1;

      await runAttacks(
        matchMakerV2,
        eventLogger,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await cloudCoverMove.getAddress(),
      );

      const statusEffectsMonster1 = await matchMakerV2.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(1);

      const statusEffectsMonster2 = await matchMakerV2.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(1);
    });

    it("should allow basic gameplay", async function () {
      const {
        account2,
        account3,
        monsterApiV1,
        matchMakerV2,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMakerV2.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMakerV2.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

      expect(await matchMakerV2.matchCount()).to.equal(BigInt(1));

      const { damageOverTimeAttack } = await deployAttacks(
        eventLogger,
        moveExecutorV1,
      );

      const matchId = 1;

      while (true) {
        try {
          await runAttacks(
            matchMakerV2,
            eventLogger,
            account2,
            account3,
            matchId,
            await damageOverTimeAttack.getAddress(),
            await damageOverTimeAttack.getAddress(),
          );
        } catch (e: any) {
          if (e.message.includes("MatchMakerV2: game over")) {
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
        account2,
        account3,
        matchMakerV2,
        monsterApiV1,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMakerV2.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await matchMakerV2.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

      const matchId = await matchMakerV2.matchCount();

      const { healMove, damageOverTimeAttack, speedAuraMove, cloudCoverMove } =
        await deployAttacks(eventLogger, moveExecutorV1);

      // lets run a speed aura first to make player 2 faster than player 1
      await runAttacks(
        matchMakerV2,
        eventLogger,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await speedAuraMove.getAddress(),
      );

      const attackResults = await runAttacks(
        matchMakerV2,
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

    it("should have issues fixed that occured in a battle on 2023-10-20", async () => {
      const {
        account2,
        account3,
        monsterApiV1,
        matchMakerV2,
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
      } = await deployAttacks(eventLogger, moveExecutorV1);

      await cloudCoverEffect.setChance(100);

      await matchMakerV2.connect(account2).createAndJoin(0, "10", "6"); // Fernopig + Wavepaw
      await matchMakerV2.connect(account3).createAndJoin(0, "6", "10"); // Fernopig + Wavepaw

      let [, , monster1Hp, , , speed1] = await matchMakerV2.monsters(1);
      let [, , monster2Hp, , , speed2] = await matchMakerV2.monsters(3);

      expect(monster1Hp).to.equal(BigInt(120));
      expect(monster2Hp).to.equal(BigInt(125));
      expect(speed1).to.equal(BigInt(140));
      expect(speed2).to.equal(BigInt(125));

      const matchId = 1;

      await runAttacks(
        matchMakerV2,
        eventLogger,
        account2,
        account3,
        matchId,
        await purgeBuffsMove.getAddress(),
        await cloudCoverMove.getAddress(),
      );

      let statusEffectsMonster1 = await matchMakerV2.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(0);

      let statusEffectsMonster2 = await matchMakerV2.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(1);
      expect(statusEffectsMonster2[0][0]).to.equal(
        await cloudCoverEffect.getAddress(),
      );
      expect(statusEffectsMonster2[0][1]).to.equal(
        BigInt(2), // turns left
      );

      // no damage yet
      [, , monster1Hp] = await matchMakerV2.monsters(1);
      [, , monster2Hp] = await matchMakerV2.monsters(3);
      expect(monster1Hp).to.equal(BigInt(120));
      expect(monster2Hp).to.equal(BigInt(125));

      await runAttacks(
        matchMakerV2,
        eventLogger,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await speedAuraMove.getAddress(),
      );

      // no damage yet
      [, , monster1Hp] = await matchMakerV2.monsters(1);
      [, , monster2Hp] = await matchMakerV2.monsters(3);
      expect(monster1Hp).to.equal(BigInt(120));
      expect(monster2Hp).to.equal(BigInt(125));

      statusEffectsMonster1 = await matchMakerV2.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(1);
      expect(statusEffectsMonster1[0][0]).to.equal(
        await cloudCoverEffect.getAddress(),
      );
      expect(statusEffectsMonster1[0][1]).to.equal(
        BigInt(2), // turns left
      );

      statusEffectsMonster2 = await matchMakerV2.getStatusEffectsArray(3);
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
        matchMakerV2,
        eventLogger,
        account2,
        account3,
        matchId,
        await speedAuraMove.getAddress(),
        await damageOverTimeAttack.getAddress(),
      );

      // big damage
      [, , monster1Hp] = await matchMakerV2.monsters(1);
      [, , monster2Hp] = await matchMakerV2.monsters(3);
      expect(monster1Hp).to.equal(BigInt(12));
      expect(monster2Hp).to.equal(BigInt(125));

      statusEffectsMonster1 = await matchMakerV2.getStatusEffectsArray(1);
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

      statusEffectsMonster2 = await matchMakerV2.getStatusEffectsArray(3);
      expect(statusEffectsMonster2.length).to.equal(1);
      expect(statusEffectsMonster2[0][0]).to.equal(
        await speedAuraEffect.getAddress(),
      );
      expect(statusEffectsMonster2[0][1]).to.equal(
        BigInt(253), // turns left
      );

      await runAttacks(
        matchMakerV2,
        eventLogger,
        account2,
        account3,
        matchId,
        await controlMove.getAddress(),
        await elementalWallMove.getAddress(),
      );

      // first monster killed
      [, , monster1Hp] = await matchMakerV2.monsters(1);
      [, , monster2Hp] = await matchMakerV2.monsters(3);
      expect(monster1Hp).to.equal(BigInt(0));
      expect(monster2Hp).to.equal(BigInt(125));

      statusEffectsMonster2 = await matchMakerV2.getStatusEffectsArray(3);
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
      account2,
      account3,
      matchMakerV2,
      monsterApiV1,
      eventLogger,
      moveExecutorV1,
    } = await deploy();

    await createMockMonsters(monsterApiV1);

    await matchMakerV2.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
    await matchMakerV2.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

    const matchId = await matchMakerV2.matchCount();

    const { damageOverTimeAttack, damageOverTimeEffect } = await deployAttacks(
      eventLogger,
      moveExecutorV1,
    );

    await runAttacks(
      matchMakerV2,
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
      account2,
      account3,
      matchMakerV2,
      monsterApiV1,
      eventLogger,
      moveExecutorV1,
    } = await deploy();

    await createMockMonsters(monsterApiV1);

    await matchMakerV2.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
    await matchMakerV2.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature

    const matchId = await matchMakerV2.matchCount();

    const { cloudCoverMove } = await deployAttacks(eventLogger, moveExecutorV1);

    await runAttacks(
      matchMakerV2,
      eventLogger,
      account2,
      account3,
      matchId,
      await cloudCoverMove.getAddress(),
      await cloudCoverMove.getAddress(),
    );

    const match = await matchMakerV2.getMatchByUser(account2.getAddress());
    expect(match[0]).to.equal(matchId);
  });
});
