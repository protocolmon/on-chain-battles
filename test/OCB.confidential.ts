import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Address, zeroAddress } from "viem";
import { createMockMonsters } from "./attacks/createMockMonsters";
import { MatchMakerV3Confidential } from "../typechain-types";
import { Signer } from "ethers";
import { deployAttacks } from "./attacks/deployAttacks";

const ONE_MINUTE = 60;

const signIn = async (signer: Signer, verifyingContract: string | Address) => {
  const time = Math.floor(new Date().getTime() / 1000);
  const user = await signer.getAddress();

  // Ask user to "Sign-In" every 24 hours.
  const signature = await signer.signTypedData(
    {
      name: "OnChainBattles.SignIn",
      version: "1",
      chainId: 31337,
      verifyingContract,
    },
    {
      SignIn: [
        { name: "user", type: "address" },
        { name: "time", type: "uint32" },
      ],
    },
    {
      user,
      time: time,
    },
  );

  const rsv = ethers.Signature.from(signature);
  return { user, time, rsv };
};

describe("OCB confidential", function () {
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

    await (
      matchMakerV3Confidential as unknown as MatchMakerV3Confidential
    ).setMode(0, ONE_MINUTE * 60, zeroAddress);
    await eventLogger.addWriter(await matchMakerV3Confidential.getAddress());

    await moveExecutorV1.grantRole(
      await moveExecutorV1.PERMITTED_ROLE(),
      await matchMakerV3Confidential.getAddress(),
    );

    await eventLogger.addWriter(await moveExecutorV1.getAddress());

    return {
      owner,
      account2,
      account3,
      eventLogger,
      matchMaker:
        matchMakerV3Confidential as unknown as MatchMakerV3Confidential,
      monsterApiV1,
      moveExecutorV1,
    };
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

    it("should allow confidential gameplay", async function () {
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

      const authPlayer1 = await signIn(account2, await matchMaker.getAddress());
      const authPlayer2 = await signIn(account3, await matchMaker.getAddress());

      const matchId = 1n;

      await matchMaker
        .connect(account2)
        .createAndJoin(authPlayer1, 0, "1", "3"); // join with fire and water

      await matchMaker
        .connect(account3)
        .createAndJoin(authPlayer2, 0, "4", "5"); // join with water and nature

      expect(await matchMaker.matchCount()).to.equal(matchId);

      const { cloudCoverMove, purgeBuffsMove } = await deployAttacks(
        owner,
        eventLogger,
        moveExecutorV1,
      );

      let match = await matchMaker.getMatchById(authPlayer1, matchId);

      // round should be zero at start
      expect(match[1][6]).to.equal(0n);

      await matchMaker
        .connect(account2)
        .reveal(authPlayer1, matchId, cloudCoverMove);

      await matchMaker
        .connect(account3)
        .reveal(authPlayer2, matchId, purgeBuffsMove);

      match = await matchMaker.getMatchById(authPlayer1, matchId);

      // round should be one now
      expect(match[1][6]).to.equal(1n);
    });
  });
});
