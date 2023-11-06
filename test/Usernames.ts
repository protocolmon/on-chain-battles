import { expect } from "chai";
import { ethers } from "hardhat";
import { UsernamesV1 } from "../typechain-types";

describe("Usernames", function () {
  async function deploy() {
    const signers = await ethers.getSigners();
    const [owner] = signers;

    const UsernamesV1 = await ethers.getContractFactory("UsernamesV1");
    const usernamesV1: UsernamesV1 = await UsernamesV1.deploy();

    return {
      owner,
      usernamesV1,
    };
  }

  it("should allow to set a username", async function () {
    const { owner, usernamesV1 } = await deploy();

    await usernamesV1.registerName("test");

    expect(await usernamesV1.addressToName(await owner.getAddress())).to.equal(
      "test",
    );
  });
});
