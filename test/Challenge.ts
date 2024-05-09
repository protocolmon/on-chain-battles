import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { EventLoggerV1, MatchMakerV3 } from "../typechain-types";
import { Signer } from "ethers";
import { createMockMonsters } from "./attacks/createMockMonsters";
import { deployAttacks } from "./attacks/deployAttacks";
import { zeroAddress } from "viem";

const ONE_MINUTE = 60;

enum ChallengeMode {
  Queue,
  OnlyChallenge,
  QueueAndChallenge,
}

const getCommitHash = (move: string, secret: string = "secret") =>
  ethers.solidityPackedKeccak256(
    ["address", "bytes32"],
    [move, ethers.encodeBytes32String(secret)],
  );

describe("Advanced Game Modes", function () {
  async function deploy() {
    const signers = await ethers.getSigners();
    const [owner, account2, account3, account4] = signers;

    const MoveExecutorV1 = await ethers.getContractFactory("MoveExecutorV1");
    const moveExecutorV1 = await MoveExecutorV1.deploy(
      await owner.getAddress(),
    );
    const UsernamesV1 = await ethers.getContractFactory("UsernamesV1");
    const userNamesV1 = await UsernamesV1.deploy(await owner.getAddress());

    const MonsterApiV1 = await ethers.getContractFactory("MonsterApiV1");
    const monsterApiV1 = await MonsterApiV1.deploy();

    const EventLoggerV1 = await ethers.getContractFactory("EventLoggerV1");
    const eventLogger = await EventLoggerV1.deploy(
      await owner.getAddress(),
      true,
    );

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

    const IndividualLeaderboardV1 =
      await ethers.getContractFactory("LeaderboardV1");
    const individualLeaderboardV1 = await upgrades.deployProxy(
      IndividualLeaderboardV1 as any,
      [await matchMakerV3.getAddress(), await userNamesV1.getAddress()],
    );

    const TimeoutMove = await ethers.getContractFactory("TimeoutMove");
    const timeoutMove = await TimeoutMove.deploy();
    await eventLogger.addWriter(await timeoutMove.getAddress());
    await timeoutMove.setLogger(await eventLogger.getAddress());
    await timeoutMove.addExecutor(await moveExecutorV1.getAddress());

    await (matchMakerV3 as unknown as MatchMakerV3).setMode(
      0,
      ONE_MINUTE,
      await timeoutMove.getAddress(),
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
      account4,
      eventLogger,
      matchMaker: matchMakerV3 as unknown as MatchMakerV3,
      monsterApiV1,
      moveExecutorV1,
      leaderboardV1,
      timeoutMove,
      individualLeaderboardV1,
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

  async function runAttacks(
    matchMaker: MatchMakerV3,
    eventLogger: EventLoggerV1,
    player1: Signer,
    player2: Signer,
    matchId: number | bigint,
    move1: string,
    move2?: string,
  ): Promise<any[]> {
    const events = [];

    events.push(
      ...(await commit(matchMaker, eventLogger, player1, matchId, move1)),
    );
    if (move2) {
      events.push(
        ...(await commit(matchMaker, eventLogger, player2, matchId, move2)),
      );
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

  const ONE_DAY = 24 * 60 * 60;

  async function geTimestamp() {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    return blockBefore?.timestamp ?? -1;
  }

  async function increaseTime(time: number) {
    await ethers.provider.send("evm_increaseTime", [time]);
    await ethers.provider.send("evm_mine");
  }

  async function setAdvancedMode(
    matchMaker: MatchMakerV3,
    mode: number | bigint,
    noLeaderboard: boolean,
    individualLeaderboard: string,
    challengeMode: ChallengeMode,
    joinFrom: number | bigint,
    joinUntil: number | bigint,
    commitUntil: number | bigint,
  ): Promise<void> {
    await matchMaker.setAdvancedMode(
      mode,
      noLeaderboard,
      individualLeaderboard,
      challengeMode,
      joinFrom,
      joinUntil,
      commitUntil,
    );
  }

  describe("Setup games", function () {
    it("should set advanded settings", async function () {
      const { matchMaker, timeoutMove, individualLeaderboardV1 } =
        await deploy();
      await matchMaker.setMode(1, ONE_MINUTE, await timeoutMove.getAddress());

      await setAdvancedMode(
        matchMaker,
        1,
        true,
        zeroAddress,
        ChallengeMode.OnlyChallenge,
        0,
        0,
        0,
      );

      await matchMaker.setMode(2, ONE_MINUTE, await timeoutMove.getAddress());

      const individualLeaderboardV1address =
        await individualLeaderboardV1.getAddress();
      await setAdvancedMode(
        matchMaker,
        2,
        false,
        individualLeaderboardV1address,
        ChallengeMode.QueueAndChallenge,
        10,
        20,
        30,
      );

      const mode1 = await matchMaker.advancedMode(0);
      const mode2 = await matchMaker.advancedMode(1);
      const mode3 = await matchMaker.advancedMode(2);

      // Default settings
      expect(mode1.noLeaderboard).to.be.false;
      expect(mode1.individualLeaderboard).to.equal(zeroAddress);
      expect(mode1.challengeMode).to.equal(ChallengeMode.Queue);
      expect(mode1.joinFrom).to.equal(0);
      expect(mode1.joinUntil).to.equal(0);
      expect(mode1.commitUntil).to.equal(0);

      // Challenge Only - no leaderboard
      expect(mode2.noLeaderboard).to.be.true;
      expect(mode2.individualLeaderboard).to.equal(zeroAddress);
      expect(mode2.challengeMode).to.equal(ChallengeMode.OnlyChallenge);
      expect(mode2.joinFrom).to.equal(0);
      expect(mode2.joinUntil).to.equal(0);
      expect(mode2.commitUntil).to.equal(0);

      // Mixed - individual leaderboard
      expect(mode3.noLeaderboard).to.be.false;
      expect(mode3.individualLeaderboard).to.equal(
        individualLeaderboardV1address,
      );
      expect(mode3.challengeMode).to.equal(ChallengeMode.QueueAndChallenge);
      expect(mode3.joinFrom).to.equal(10);
      expect(mode3.joinUntil).to.equal(20);
      expect(mode3.commitUntil).to.equal(30);
    });

    it("should allow basic gameplay for mixed Mode", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        timeoutMove,
        matchMaker,
        eventLogger,
        leaderboardV1,
        moveExecutorV1,
      } = await deploy();

      const gamaMode = 2;
      await matchMaker.setMode(
        gamaMode,
        ONE_MINUTE,
        await timeoutMove.getAddress(),
      );

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.QueueAndChallenge,
        0,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(gamaMode, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(gamaMode, "4", "5"); // join with water and nature

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
          if (e.message.includes("MMV3: game over")) {
            break;
          }
          throw e;
        }
      }

      const stats = await leaderboardV1.getAllStats(0);
      expect(stats.length).to.equal(2);
    });
  });

  describe("Challenge oponent", function () {
    it("should not be able to join queue", async function () {
      const { account2, monsterApiV1, matchMaker } = await deploy();

      const gamaMode = 0;

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.OnlyChallenge,
        0,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);

      await expect(
        matchMaker.connect(account2).createAndJoin(gamaMode, "1", "3"),
      ).to.be.revertedWith("MMV3: This mode supports challenge only");
    });

    it("should not be able to join wrong challenge", async function () {
      const { account2, account3, monsterApiV1, matchMaker } = await deploy();

      const gamaMode = 0;

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.OnlyChallenge,
        0,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);

      await expect(
        matchMaker.connect(account3).acceptChallenge(0, "4", "5"),
      ).to.be.revertedWith("MMV3: Not challenged");
      await matchMaker
        .connect(account2)
        .challengeOponent(gamaMode, "1", "3", account3.address);
      const challenges = await matchMaker
        .connect(account3)
        .getChallengeListByUser(account3.address, gamaMode);
      expect(challenges.length).to.be.equal(1);

      await expect(
        matchMaker
          .connect(account2)
          .acceptChallenge(challenges[0].id, "4", "5"),
      ).to.be.revertedWith("MMV3: Not challenged");
    });

    it("should be able to reject challenge", async function () {
      const { account2, account3, monsterApiV1, matchMaker } = await deploy();

      const gamaMode = 0;

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.OnlyChallenge,
        0,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);

      await matchMaker
        .connect(account2)
        .challengeOponent(gamaMode, "1", "3", account3.address);
      let challenges = await matchMaker
        .connect(account3)
        .getChallengeListByUser(account3.address, gamaMode);
      expect(challenges.length).to.be.equal(1);

      // reject as challenger
      await matchMaker.connect(account2).rejectChallenge(challenges[0].id);

      await matchMaker
        .connect(account2)
        .challengeOponent(gamaMode, "1", "3", account3.address);
      challenges = await matchMaker
        .connect(account3)
        .getChallengeListByUser(account3.address, gamaMode);
      expect(challenges.length).to.be.equal(2);

      // reject as challenged
      await matchMaker.connect(account3).rejectChallenge(challenges[1].id);
    });

    it("should not be able to join queue in challenge only mode", async function () {
      const { account3, monsterApiV1, matchMaker } = await deploy();

      const gamaMode = 0;

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.OnlyChallenge,
        0,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);
      await expect(
        matchMaker.connect(account3).createAndJoin(0, "4", "5"),
      ).to.be.revertedWith("MMV3: This mode supports challenge only");
    });

    it("should not be able challenge the same player twice", async function () {
      const { account2, account3, monsterApiV1, matchMaker } = await deploy();

      const gamaMode = 0;

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.OnlyChallenge,
        0,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);

      await matchMaker
        .connect(account2)
        .challengeOponent(gamaMode, "1", "3", account3.address);

      await expect(
        matchMaker
          .connect(account2)
          .challengeOponent(gamaMode, "1", "3", account3.address),
      ).to.be.revertedWith("MMV3: you already challenged this player");
    });

    it("should play a challenge game", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        matchMaker,
        eventLogger,
        leaderboardV1,
        moveExecutorV1,
      } = await deploy();

      const gamaMode = 0;

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.OnlyChallenge,
        0,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);

      await matchMaker
        .connect(account2)
        .challengeOponent(gamaMode, "1", "3", account3.address);
      const challenges = await matchMaker
        .connect(account3)
        .getChallengeListByUser(account3.address, gamaMode);
      expect(challenges.length).to.be.equal(1);

      await matchMaker
        .connect(account3)
        .acceptChallenge(challenges[0].id, "4", "5");
      const matches = await matchMaker
        .connect(account3)
        .getMatchListByUser(account3.address, gamaMode);
      expect(matches.length).to.be.equal(1);

      expect(await matchMaker.matchCount()).to.equal(BigInt(1));

      const { damageOverTimeAttack } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      const matchId = matches[0].id;

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
          if (e.message.includes("MMV3: game over")) {
            break;
          }
          throw e;
        }
      }

      const stats = await leaderboardV1.getAllStats(0);
      expect(stats.length).to.equal(2);
    });

    it("should be able to challenge two player", async function () {
      const {
        owner,
        account2,
        account3,
        account4,
        monsterApiV1,
        matchMaker,
        eventLogger,
        leaderboardV1,
        moveExecutorV1,
      } = await deploy();

      const gamaMode = 0;

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.OnlyChallenge,
        0,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);

      await matchMaker
        .connect(account2)
        .challengeOponent(gamaMode, "1", "3", account3.address);
      await matchMaker
        .connect(account2)
        .challengeOponent(gamaMode, "1", "3", account4.address);
      let challenges = await matchMaker
        .connect(account3)
        .getChallengeListByUser(account3.address, gamaMode);
      expect(challenges.length).to.be.equal(1);
      await matchMaker
        .connect(account3)
        .acceptChallenge(challenges[0].id, "4", "5");
      challenges = await matchMaker
        .connect(account4)
        .getChallengeListByUser(account4.address, gamaMode);
      expect(challenges.length).to.be.equal(1);
      await matchMaker
        .connect(account4)
        .acceptChallenge(challenges[0].id, "4", "5");

      challenges = await matchMaker
        .connect(account2)
        .getChallengeListByUser(account2.address, gamaMode);
      expect(challenges.length).to.be.equal(2);

      const matches = await matchMaker
        .connect(account3)
        .getMatchListByUser(account2.address, gamaMode);
      expect(matches.length).to.be.equal(2);

      expect(await matchMaker.matchCount()).to.equal(BigInt(2));

      const { damageOverTimeAttack } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      let gameOverCount = 0;
      while (true) {
        try {
          await runAttacks(
            matchMaker,
            eventLogger,
            account2,
            account3,
            matches[0].id,
            await damageOverTimeAttack.getAddress(),
            await damageOverTimeAttack.getAddress(),
          );
          await runAttacks(
            matchMaker,
            eventLogger,
            account2,
            account4,
            matches[1].id,
            await damageOverTimeAttack.getAddress(),
            await damageOverTimeAttack.getAddress(),
          );
        } catch (e: any) {
          if (e.message.includes("MMV3: game over")) {
            gameOverCount++;
            if (gameOverCount === 2) {
              break;
            }
          } else {
            throw e;
          }
        }
      }

      const stats = await leaderboardV1.getAllStats(0);
      expect(stats.length).to.equal(3);
    });
  });

  describe("Mixed mode", function () {
    it("should be able to join queue and challenge", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        timeoutMove,
        matchMaker,
        eventLogger,
        leaderboardV1,
        moveExecutorV1,
      } = await deploy();

      const gamaMode = 2;
      await matchMaker.setMode(
        gamaMode,
        ONE_MINUTE,
        await timeoutMove.getAddress(),
      );

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.QueueAndChallenge,
        0,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(gamaMode, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(gamaMode, "4", "5"); // join with water and nature

      await matchMaker
        .connect(account2)
        .challengeOponent(gamaMode, "1", "3", account3.address);
      const challenges = await matchMaker
        .connect(account3)
        .getChallengeListByUser(account3.address, gamaMode);
      await matchMaker
        .connect(account3)
        .acceptChallenge(challenges[0].id, "4", "5");

      expect(await matchMaker.matchCount()).to.equal(BigInt(2));

      const { damageOverTimeAttack } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      let gameOverCount = 0;

      while (true) {
        try {
          await runAttacks(
            matchMaker,
            eventLogger,
            account2,
            account3,
            1,
            await damageOverTimeAttack.getAddress(),
            await damageOverTimeAttack.getAddress(),
          );
          await runAttacks(
            matchMaker,
            eventLogger,
            account2,
            account3,
            2,
            await damageOverTimeAttack.getAddress(),
            await damageOverTimeAttack.getAddress(),
          );
        } catch (e: any) {
          if (e.message.includes("MMV3: game over")) {
            gameOverCount++;
            if (gameOverCount === 2) {
              break;
            }
          } else {
            throw e;
          }
        }
      }
      let match = await matchMaker.getMatchById(1);
      expect(match._match.phase).to.equal(2);
      match = await matchMaker.getMatchById(2);
      expect(match._match.phase).to.equal(2);
      const stats = await leaderboardV1.getAllStats(0);
      expect(stats.length).to.equal(2);
    });
  });

  describe("Advanced leaderboard", function () {
    it("should not track in leaderboard", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        timeoutMove,
        matchMaker,
        eventLogger,
        leaderboardV1,
        moveExecutorV1,
      } = await deploy();

      const gamaMode = 2;
      await matchMaker.setMode(
        gamaMode,
        ONE_MINUTE,
        await timeoutMove.getAddress(),
      );

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        true,
        zeroAddress,
        ChallengeMode.QueueAndChallenge,
        0,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(gamaMode, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(gamaMode, "4", "5"); // join with water and nature

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
          if (e.message.includes("MMV3: game over")) {
            break;
          }
          throw e;
        }
      }

      const stats = await leaderboardV1.getAllStats(0);
      expect(stats.length).to.equal(0);
    });

    it("should track games in individual leaderboard", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        timeoutMove,
        matchMaker,
        eventLogger,
        leaderboardV1,
        individualLeaderboardV1,
        moveExecutorV1,
      } = await deploy();

      const gamaMode = 2;
      await matchMaker.setMode(
        gamaMode,
        ONE_MINUTE,
        await timeoutMove.getAddress(),
      );
      const individualLeaderboardV1address =
        await individualLeaderboardV1.getAddress();

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        individualLeaderboardV1address,
        ChallengeMode.QueueAndChallenge,
        0,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(gamaMode, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(gamaMode, "4", "5"); // join with water and nature

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
          if (e.message.includes("MMV3: game over")) {
            break;
          }
          throw e;
        }
      }

      let stats = await individualLeaderboardV1.getAllStats(0);
      expect(stats.length).to.equal(2);
      stats = await leaderboardV1.getAllStats(0);
      expect(stats.length).to.equal(0);
    });
  });

  describe("Timed modes", function () {
    it("should not be able to join future tournament", async function () {
      const { account2, monsterApiV1, matchMaker } = await deploy();

      const gamaMode = 0;

      const ts = await geTimestamp();

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.QueueAndChallenge,
        ts + ONE_DAY,
        0,
        0,
      );

      await createMockMonsters(monsterApiV1);

      await expect(
        matchMaker.connect(account2).createAndJoin(gamaMode, "1", "3"),
      ).to.be.revertedWith("MMV3: game mode has not jet started");
    });
    it("should not be able to join past tournament", async function () {
      const { account2, monsterApiV1, matchMaker } = await deploy();

      const gamaMode = 0;

      const ts = await geTimestamp();

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.QueueAndChallenge,
        0,
        ts,
        0,
      );
      await increaseTime(ONE_DAY);

      await createMockMonsters(monsterApiV1);

      await expect(
        matchMaker.connect(account2).createAndJoin(gamaMode, "1", "3"),
      ).to.be.revertedWith("MMV3: game mode can no longer be played");
    });

    it("should not be able to join a game past commitUntil", async function () {
      const { account2, monsterApiV1, matchMaker } = await deploy();

      const gamaMode = 0;

      const ts = await geTimestamp();

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.QueueAndChallenge,
        0,
        0,
        ts,
      );
      await increaseTime(ONE_DAY);

      await createMockMonsters(monsterApiV1);

      await expect(
        matchMaker.connect(account2).createAndJoin(gamaMode, "1", "3"),
      ).to.be.revertedWith("MMV3: game mode can no longer be played");
    });

    it("should not be able to commit a move past commitUntil", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        matchMaker,
        eventLogger,
        moveExecutorV1,
      } = await deploy();

      const { damageOverTimeAttack } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      const gamaMode = 0;

      const ts = await geTimestamp();

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.QueueAndChallenge,
        0,
        0,
        ts + ONE_DAY,
      );

      await createMockMonsters(monsterApiV1);
      await matchMaker.connect(account2).createAndJoin(gamaMode, "1", "3");
      await matchMaker.connect(account3).createAndJoin(gamaMode, "2", "4");

      await commitSingleAttack(
        matchMaker,
        eventLogger,
        account2,
        1,
        await damageOverTimeAttack.getAddress(),
      );

      await increaseTime(ONE_DAY * 2);
      await expect(
        commitSingleAttack(
          matchMaker,
          eventLogger,
          account3,
          1,
          await damageOverTimeAttack.getAddress(),
        ),
      ).to.be.revertedWith("MMV3: can no longer commit to match");
    });

    it("should be able to run game within time frame", async function () {
      const {
        owner,
        account2,
        account3,
        monsterApiV1,
        timeoutMove,
        matchMaker,
        eventLogger,
        leaderboardV1,
        moveExecutorV1,
      } = await deploy();

      const gamaMode = 2;
      await matchMaker.setMode(
        gamaMode,
        ONE_MINUTE,
        await timeoutMove.getAddress(),
      );

      const ts = await geTimestamp();

      await setAdvancedMode(
        matchMaker,
        gamaMode,
        false,
        zeroAddress,
        ChallengeMode.QueueAndChallenge,
        ts,
        ts * 2,
        ts * 2,
      );

      await increaseTime(ONE_DAY);

      await createMockMonsters(monsterApiV1);

      await matchMaker.connect(account2).createAndJoin(gamaMode, "1", "3"); // join with fire and water
      await matchMaker.connect(account3).createAndJoin(gamaMode, "4", "5"); // join with water and nature

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
          if (e.message.includes("MMV3: game over")) {
            break;
          }
          throw e;
        }
      }

      const stats = await leaderboardV1.getAllStats(0);
      expect(stats.length).to.equal(2);
    });
  });
});
