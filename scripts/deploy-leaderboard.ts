import { ethers } from "hardhat";
import { deployContract, deployProxy } from "./utils";
import contracts from "../tmp/contracts.generated.sapphire.json";
import { LeaderboardManagerV1, UsernamesV1 } from "../typechain-types";

const usernamesList: string[] = [
  "shadowfangz",
  "beastwhisperer",
  "mysticte_rror",
  "venomclaw78",
  "darkspectre",
  "thunderroar59",
  "savagespirit",
  "infernofury",
  "titanwrath",
  "phantomstalker",
  "chaosdr_if_ter",
  "frostbitereign",
  "g_loombringer",
  "dreadknight",
  "echoravage79",
  "vort_ex_master64",
  "necrofeast41",
  "iron__maw39",
  "abysshunter84",
  "crimsonfang27",
  "soulharvester",
  "stormbreaker52",
  "nighthowler53",
  "la_v_abehemoth24",
  "warpstalker42",
  "runeguardian",
  "skyterror99",
  "earthshaker40",
  "f_lamereaper46",
  "voidwalker64",
];

const randomEthAddresses: string[] = [
  "0xb0d76a20a75854819bdd21fb2dc14a8139ea49f6",
  "0x3d3d942c3a12d4c68fa13da3748eb6a38996c521",
  "0x817e971d287595db51ba6303e1fe7d6777ba3b2f",
  "0xdca909513373bcbf6b3ae664303bdf97fc3bb209",
  "0xd1df94de72093eeb8dac6e3526c0255cfe20f199",
  "0x6a1bca47784cf7f3a1a2ab23aa2f2e30a92c715e",
  "0xdbbf1e325be87b2cdadaad41aad66c6836353a65",
  "0xe9fe77da0f79a372ea962a2753480b55314d1363",
  "0x05ed1023b4474b1467a2db7ce70dcf6922af75b8",
  "0x2532e7ded78c94e4c17aa275705cc8681b4a963f",
  "0xea457d1bd1a3236922871b523bef29892f9a08f2",
  "0xc73b7609c866218b80cda9c377295202fa5016ec",
  "0x47fb3d8e1eda7be0305c7680642c6071df7f9b7f",
  "0xfaf524e94869a2822b5e66df549347af3ca9f4d4",
  "0x91354b7ffd5610387854597e210c9c5188cf0829",
  "0xb223cb1a29fef57124b2e9557921a367a9038609",
  "0x1c27dfb605d5c5370db9c1d46f7a89731c691393",
  "0xeb80a920c0c7e96a5f205f865bcc86aa7b8badb3",
  "0xc9215180bb482ce687d0bd258ed54624fa482bf1",
  "0xa33219310aef5cffb20a6141a097b036be546d67",
  "0x13e492685b1c080f214ab30d6a8a76fa5a3d63fb",
  "0x5d0ae407be253969138613e96c9f19860740201a",
  "0xd6e331f69555c2523fee6b7414d698069d310161",
  "0x9b3986a467d12e99a6b91f2bff947c5c2dc8396f",
  "0x1ce2c1075542f60653f3db65a9ca242b25c7f40b",
  "0xbe936088704c176f05869e29e5dac6680e9cfe75",
  "0x944918fd463d1e78db3dbc61aee5b308e94b94dc",
  "0xae071ca9bca749cde572363ee91400b58e7544a3",
  "0x4a29454b25e152b8a25575b88d5bb379c9db2b36",
  "0x6a4f78a1746f605d988e01f0e2f97aff15dfaab0",
];

async function main() {
  const [deployer] = await ethers.getSigners();

  // const { address: usernamesAddress, instance: usernames } =
  //   await deployContract("UsernamesV1", [await deployer.getAddress()]);

  const usernameAddress = "0x950BBdbaD9477B29299b7ff86C5030304f561a3d";

  // let i = 0;
  // for (const username of usernamesList) {
  //   await (usernames as unknown as UsernamesV1).registerNameAsOwner(
  //     username,
  //     randomEthAddresses[i],
  //   );
  //   i++;
  // }

  const { instance: manager } = await deployProxy("LeaderboardManagerV1", [
    await deployer.getAddress(),
  ]);

  const { address: leaderboardAddress, instance: leaderboard } =
    await deployProxy("LeaderboardV1", [
      await deployer.getAddress(),
      contracts.contracts.UsernamesV1,
    ]);

  await (manager as unknown as LeaderboardManagerV1).setLeaderboard(
    1n,
    leaderboardAddress,
  );

  await leaderboard.setMatchMaker(await deployer.getAddress());
  await leaderboard.setUsernames("0x950BBdbaD9477B29299b7ff86C5030304f561a3d");

  // Randomly assign wins, escapes, and losses
  for (let i = 0; i < 100; i++) {
    const action = Math.floor(Math.random() * 3); // Random number between 0 and 2
    const playerIndex = Math.floor(Math.random() * randomEthAddresses.length);
    const playerAddress = randomEthAddresses[playerIndex];

    switch (action) {
      case 0: // Add escape
        await leaderboard.addEscape(playerAddress);
        break;
      case 1: // Add win
        await leaderboard.addWin(playerAddress);
        break;
      case 2: // Add loss
        await leaderboard.addLoss(playerAddress);
        break;
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
