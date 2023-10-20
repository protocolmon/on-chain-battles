import * as blessed from "blessed";
import { getContractInstance } from "../utils/contracts";
import { MatchMakerV2 } from "../../typechain-types";

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

export const monsterStatusBox = createBox({
  top: 0,
  left: 0,
  width: "50%",
  height: "12%",
  content: "Your monster status...",
  style: { fg: "white", bg: "magenta" },
});

export const monsterStatusBoxOpponent = createBox({
  top: "12%",
  left: 0,
  width: "50%",
  height: "12%",
  content: "Opponent monster status...",
  style: { fg: "white", bg: "blue" },
});

export const statusEffectsBox = createBox({
  top: 0,
  left: "50%",
  width: "50%",
  height: "12%",
  content: "No status effects",
  style: { fg: "white", bg: "magenta" },
});

export const statusEffectsBoxOpponent = createBox({
  top: "12%",
  left: "50%",
  width: "50%",
  height: "12%",
  content: "No status effects",
  style: { fg: "white", bg: "blue" },
});

// Create a box for logs
export const logBox = createBox({
  top: "24%",
  left: 0,
  width: "100%",
  height: "50%",
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
    await matchMakerV2.withdraw();
  } catch (e) {
    console.error(e);
  }

  process.exit(code);
}

// Render the screen
screen.render();
