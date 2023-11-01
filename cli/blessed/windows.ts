import * as blessed from "blessed";
import { getContractInstance } from "../utils/contracts";
import { MatchMakerV2 } from "../../typechain-types";
import { ethers } from "hardhat";

// Create a blessed screen
export const screen = blessed.screen({
  smartCSR: true,
  title: "OCB CLI",
  width: "100%",
});

function createBox(options: any) {
  return blessed.box({
    parent: screen,
    align: "left",
    valign: "top",
    padding: 0,
    border: { type: "line" },
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    ...options,
  });
}

// Create a box for logs
export const logBox = createBox({
  top: "0%",
  left: 0,
  width: "100%",
  height: "74%",
  input: true,
  keys: true,
});

screen.append(logBox);

screen.key(["q", "C-c", "s", "w"], (ch, key) => {
  if (key.name === "c" && key.ctrl) {
    // This checks for Control-C
    exit(0);
  } else {
    switch (key.name) {
      case "q":
        exit(0);
        break;
      case "s":
        logBox.scroll(1);
        screen.render();
        break;
      case "w":
        logBox.scroll(-1);
        screen.render();
        break;
    }
  }
});

async function exit(code: number) {
  try {
    const matchMakerV2 =
      await getContractInstance<MatchMakerV2>("MatchMakerV2");

    const user = await (await ethers.getSigners())[0].address;
    const [matchId] = await matchMakerV2.getMatchByUser(user);
    if (matchId) {
      await matchMakerV2.withdrawFromMatch(matchId);
    } else {
      await matchMakerV2.withdraw(0);
    }
  } catch (e) {
    console.error(e);
  }

  process.exit(code);
}

// Render the screen
screen.render();
