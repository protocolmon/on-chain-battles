import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { MatchMakerV2, MonsterApiV1 } from "../typechain-types";
import { Signer } from "ethers";

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
    const moveExecutorV1 = await MoveExecutorV1.deploy();

    const MonsterApiV1 = await ethers.getContractFactory("MonsterApiV1");
    const monsterApiV1 = await MonsterApiV1.deploy();

    const MatchMakerV2 = await ethers.getContractFactory("MatchMakerV2");
    const matchMakerV2 = await upgrades.deployProxy(MatchMakerV2, [
      await monsterApiV1.getAddress(),
      await moveExecutorV1.getAddress(),
      ONE_MINUTE,
    ]);

    return {
      account2,
      account3,
      matchMakerV2: matchMakerV2 as unknown as MatchMakerV2,
      monsterApiV1,
      moveExecutorV1,
    };
  }

  async function deployAttacks() {
    const DamageOverTimeEffect = await ethers.getContractFactory(
      "DamageOverTimeEffect",
    );
    const damageOverTimeEffect = await DamageOverTimeEffect.deploy();

    const DamageOverTimeMove =
      await ethers.getContractFactory("DamageOverTimeMove");
    const damageOverTimeMove = await DamageOverTimeMove.deploy(
      await damageOverTimeEffect.getAddress(),
    );

    const CloudCoverEffect =
      await ethers.getContractFactory("CloudCoverEffect");
    const cloudCoverEffect = await CloudCoverEffect.deploy(0);

    const CloudCoverMove = await ethers.getContractFactory("CloudCoverMove");
    const cloudCoverMove = await CloudCoverMove.deploy(
      await cloudCoverEffect.getAddress(),
    );

    const SpeedAuraEffect = await ethers.getContractFactory("SpeedAuraEffect");
    const speedAuraEffect = await SpeedAuraEffect.deploy();

    const SpeedAuraMove = await ethers.getContractFactory("SpeedAuraMove");
    const speedAuraMove = await SpeedAuraMove.deploy(
      await speedAuraEffect.getAddress(),
    );

    const healMove = await ethers.getContractFactory("HealMove");
    const HealMove = await healMove.deploy();

    const PurgeBuffsMove = await ethers.getContractFactory("PurgeBuffsMove");
    const purgeBuffsMove = await PurgeBuffsMove.deploy(100);

    return {
      damageOverTimeAttack: damageOverTimeMove,
      cloudCoverMove: cloudCoverMove,
      speedAuraMove: speedAuraMove,
      healMove: HealMove,
      purgeBuffsMove: purgeBuffsMove,
    };
  }

  async function createMockMonsters(monsterApi: MonsterApiV1) {
    // two of each type
    for (const id of ["1", "2"]) {
      await monsterApi.createMonster(id, ELEMENTS.FIRE, 100, 100, 100, 100);
    }

    for (const id of ["3", "4"]) {
      await monsterApi.createMonster(id, ELEMENTS.WATER, 100, 100, 100, 100);
    }

    for (const id of ["5", "6"]) {
      await monsterApi.createMonster(id, ELEMENTS.NATURE, 100, 100, 100, 100);
    }
  }

  async function commit(
    matchMakerV2: MatchMakerV2,
    user: Signer,
    matchId: number,
    move: string,
  ) {
    await matchMakerV2.connect(user).commit(matchId, getCommitHash(move));
  }

  async function reveal(
    matchMakerV2: MatchMakerV2,
    user: Signer,
    matchId: number,
    move: string,
  ) {
    // cast "secret" to bytes32
    await matchMakerV2
      .connect(user)
      .reveal(matchId, move, ethers.encodeBytes32String("secret"));
  }

  async function runAttacks(
    matchMakerV2: MatchMakerV2,
    player1: Signer,
    player2: Signer,
    matchId: number,
    move1: string,
    move2: string,
  ) {
    await commit(matchMakerV2, player1, matchId, move1);
    await commit(matchMakerV2, player2, matchId, move2);

    await reveal(matchMakerV2, player1, matchId, move1);
    await reveal(matchMakerV2, player2, matchId, move2);
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
      const { account2, account3, monsterApiV1, matchMakerV2 } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMakerV2.connect(account2).join("1", "3"); // join with fire and water
      await matchMakerV2.connect(account3).join("4", "5"); // join with water and nature

      expect(await matchMakerV2.matchCount()).to.equal(1);

      const { speedAuraMove } = await deployAttacks();

      const matchId = 1;

      await runAttacks(
        matchMakerV2,
        account2,
        account3,
        matchId,
        await speedAuraMove.getAddress(),
        await speedAuraMove.getAddress(),
      );

      // boost should not be persisted
      const monster1 = await matchMakerV2.monsters(1);
      expect(monster1.speed).to.equal(100);

      const monster2 = await matchMakerV2.monsters(4);
      expect(monster2.speed).to.equal(100);

      const statusEffectsMonster1 = await matchMakerV2.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(1);

      const statusEffectsMonster2 = await matchMakerV2.getStatusEffectsArray(4);
      expect(statusEffectsMonster2.length).to.equal(1);
    });

    it("should allow both players to apply a heal (even if makes no sense)", async function () {
      const { account2, account3, monsterApiV1, matchMakerV2 } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMakerV2.connect(account2).join("1", "3"); // join with fire and water
      await matchMakerV2.connect(account3).join("4", "5"); // join with water and nature

      expect(await matchMakerV2.matchCount()).to.equal(1);

      const { healMove } = await deployAttacks();

      const matchId = 1;

      await runAttacks(
        matchMakerV2,
        account2,
        account3,
        matchId,
        await healMove.getAddress(),
        await healMove.getAddress(),
      );

      // hp should not be higher than initial hp
      const monster1 = await matchMakerV2.monsters(1);
      expect(monster1.hp).to.equal(100);

      const monster2 = await matchMakerV2.monsters(4);
      expect(monster2.hp).to.equal(100);

      const statusEffectsMonster1 = await matchMakerV2.getStatusEffectsArray(0);
      expect(statusEffectsMonster1.length).to.equal(0);

      const statusEffectsMonster2 = await matchMakerV2.getStatusEffectsArray(0);
      expect(statusEffectsMonster2.length).to.equal(0);
    });

    it("should destroy a cloud cover with purge buffs", async function () {
      const { account2, account3, monsterApiV1, matchMakerV2 } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMakerV2.connect(account2).join("1", "3"); // join with fire and water
      await matchMakerV2.connect(account3).join("4", "5"); // join with water and nature

      expect(await matchMakerV2.matchCount()).to.equal(1);

      const { cloudCoverMove, purgeBuffsMove } = await deployAttacks();

      const matchId = 1;

      await runAttacks(
        matchMakerV2,
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
      const { account2, account3, monsterApiV1, matchMakerV2 } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMakerV2.connect(account2).join("1", "3"); // join with fire and water
      await matchMakerV2.connect(account3).join("4", "5"); // join with water and nature

      expect(await matchMakerV2.matchCount()).to.equal(1);

      const { cloudCoverMove } = await deployAttacks();

      const matchId = 1;

      await runAttacks(
        matchMakerV2,
        account2,
        account3,
        matchId,
        await cloudCoverMove.getAddress(),
        await cloudCoverMove.getAddress(),
      );

      const statusEffectsMonster1 = await matchMakerV2.getStatusEffectsArray(1);
      expect(statusEffectsMonster1.length).to.equal(1);

      const statusEffectsMonster2 = await matchMakerV2.getStatusEffectsArray(4);
      expect(statusEffectsMonster2.length).to.equal(1);
    });

    it("should allow basic gameplay", async function () {
      const { account2, account3, monsterApiV1, matchMakerV2 } = await deploy();

      await createMockMonsters(monsterApiV1);

      await matchMakerV2.connect(account2).join("1", "3"); // join with fire and water
      await matchMakerV2.connect(account3).join("4", "5"); // join with water and nature

      expect(await matchMakerV2.matchCount()).to.equal(1);

      const { damageOverTimeAttack } = await deployAttacks();

      const matchId = 1;

      while (true) {
        try {
          await runAttacks(
            matchMakerV2,
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
  });
});
