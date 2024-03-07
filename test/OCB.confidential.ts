import { expect } from "chai";
import { ethers, upgrades, network } from "hardhat";
import { zeroAddress } from "viem";
import { createMockMonsters } from "./attacks/createMockMonsters";
import {
  EventLoggerV1,
  MatchMakerV3Confidential,
  MoveExecutorV1,
} from "../typechain-types";
import { Signer } from "ethers";

import * as sapphire from "@oasisprotocol/sapphire-paratime";

const ONE_MINUTE = 60;

async function deployAttacks(
  deployer: Signer,
  logger: EventLoggerV1,
  moveExecutorV1: MoveExecutorV1,
) {
  const CloudCoverEffect = await ethers.getContractFactory("CloudCoverEffect");
  const cloudCoverEffect = await CloudCoverEffect.deploy(0);
  await cloudCoverEffect.waitForDeployment();
  let tx = await cloudCoverEffect.setLogger(await logger.getAddress());
  await tx.wait();
  tx = await cloudCoverEffect.addExecutor(await moveExecutorV1.getAddress());
  await tx.wait();
  tx = await cloudCoverEffect.addExecutor(await deployer.getAddress());
  await tx.wait();
  tx = await logger.addWriter(await cloudCoverEffect.getAddress());
  await tx.wait();

  const CloudCoverMove = await ethers.getContractFactory("CloudCoverMove");
  const cloudCoverMove = await CloudCoverMove.deploy(
    await cloudCoverEffect.getAddress(),
  );
  await cloudCoverMove.waitForDeployment();
  tx = await cloudCoverMove.setLogger(await logger.getAddress());
  await tx.wait();
  tx = await cloudCoverMove.addExecutor(await moveExecutorV1.getAddress());
  await tx.wait();
  tx = await logger.addWriter(await cloudCoverMove.getAddress());
  await tx.wait();

  const PurgeBuffsMove = await ethers.getContractFactory("PurgeBuffsMove");
  const purgeBuffsMove = await PurgeBuffsMove.deploy(100);
  await purgeBuffsMove.waitForDeployment();
  tx = await purgeBuffsMove.setLogger(await logger.getAddress());
  await tx.wait();
  tx = await purgeBuffsMove.addExecutor(await moveExecutorV1.getAddress());
  await tx.wait();
  tx = await logger.addWriter(await purgeBuffsMove.getAddress());
  await tx.wait();

  return {
    cloudCoverMove: cloudCoverMove,
    purgeBuffsMove,
  };
}

describe("OCB confidential", function () {
  async function deploy(useCommitReveal: boolean = true) {
    const signers = await ethers.getSigners();
    const [owner, account2, account3] = signers;

    const MoveExecutorV1 = await ethers.getContractFactory("MoveExecutorV1");
    const moveExecutorV1 = await MoveExecutorV1.deploy(
      await owner.getAddress(),
    );
    await moveExecutorV1.waitForDeployment();

    const UsernamesV1 = await ethers.getContractFactory("UsernamesV1");
    const userNamesV1 = await UsernamesV1.deploy(await owner.getAddress());
    await userNamesV1.waitForDeployment();

    const MonsterApiV1 = await ethers.getContractFactory("MonsterApiV1");
    const monsterApiV1 = await MonsterApiV1.deploy();
    await monsterApiV1.waitForDeployment();

    const EventLoggerV1 = await ethers.getContractFactory("EventLoggerV1");
    const eventLogger = await EventLoggerV1.deploy(await owner.getAddress());
    await eventLogger.waitForDeployment();

    const MatchMaker = await ethers.getContractFactory(
      "MatchMakerV3Confidential",
    );
    const matchMakerV3Confidential = await upgrades.deployProxy(
      MatchMaker as any,
      [
        await monsterApiV1.getAddress(),
        await moveExecutorV1.getAddress(),
        await eventLogger.getAddress(),
      ],
    );
    await matchMakerV3Confidential.waitForDeployment();

    let tx = await (
      matchMakerV3Confidential as unknown as MatchMakerV3Confidential
    ).setMode(0, ONE_MINUTE * 60, zeroAddress);
    await tx.wait();
    tx = await eventLogger.addWriter(
      await matchMakerV3Confidential.getAddress(),
    );
    await tx.wait();

    tx = await moveExecutorV1.grantRole(
      await moveExecutorV1.PERMITTED_ROLE.staticCall(),
      await matchMakerV3Confidential.getAddress(),
    );
    await tx.wait();

    tx = await eventLogger.addWriter(await moveExecutorV1.getAddress());
    await tx.wait();

    return {
      owner: sapphire.wrap(owner),
      account2: sapphire.wrap(account2),
      account3: sapphire.wrap(account3),
      eventLogger,
      matchMaker:
        matchMakerV3Confidential as unknown as MatchMakerV3Confidential,
      monsterApiV1,
      moveExecutorV1,
    };
  }

  describe("V1", function () {
    /**
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
    */

    it.only("should allow confidential gameplay", async function () {
      const chainId = `${network.config.chainId}`;

      if (chainId !== "23294" && chainId !== "23295") {
        console.log(
          "Skipping confidential tests. Only runs on sapphire are supported. Also 3 private keys with funds are required.",
        );
        return;
      }

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

      const matchId = 1n;

      let tx = await matchMaker.connect(account2).createAndJoin(0, "1", "3"); // join with fire and water
      await tx.wait();

      tx = await matchMaker.connect(account3).createAndJoin(0, "4", "5"); // join with water and nature
      await tx.wait();

      expect(await matchMaker.matchCount.staticCall()).to.equal(matchId);

      const { cloudCoverMove, purgeBuffsMove } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      let match = await matchMaker.getMatchById.staticCall(matchId);

      // round should be zero at start
      expect(match[1][6]).to.equal(0n);

      tx = await matchMaker.connect(account2).reveal(matchId, cloudCoverMove);
      await tx.wait();

      match = await matchMaker.getMatchById.staticCall(matchId);

      // the revealed move from account2 should be hidden
      expect(match[1][2][0]).to.equal(
        "0x0000000000000000000000000000000000000000",
      );
      expect(match[1][3][0]).to.equal(
        "0x0000000000000000000000000000000000000000",
      );

      tx = await matchMaker.connect(account3).reveal(matchId, purgeBuffsMove);
      await tx.wait();

      match = await matchMaker.getMatchById.staticCall(matchId);

      // round should be one now
      expect(match[1][6]).to.equal(1n);
    });
  });
});
