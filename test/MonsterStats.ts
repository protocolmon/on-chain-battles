import { expect } from "chai";
import { ethers } from "hardhat";

enum Monster {
  Blazehorn = 1,
  Foretusk,
  Aquasteer,
  Thunderhoof,
  Psyhorn,
  Toxicorn,
  Flampanda,
  Verdubear,
  Wavepaw,
  Shockfur,
  Dreamgrowl,
  Poisonclaw,
  Pyrilla,
  Florangutan,
  Tidalmonk,
  Electrang,
  Cerebrilla,
  Gloomgrip,
  Fernopig,
  Leafsnout,
  Streamhog,
  Zappig,
  Enighog,
  Fumebrow,
  Firizard,
  Floralon,
  Reptide,
  Chargecrest,
  Cogniscale,
  Acidtongue,
  Magmaphant,
  Grovemaw,
  Aquarump,
  Voltusk,
  Mentolox,
  Sludgetrunk,
  Flarejaw,
  Verdantide,
  Bubblestream,
  Sparkfin,
  Psycheleap,
  Slimefin,
  Flamlion,
  Greenwhelp,
  Ripplemane,
  Voltmane,
  Cerebropaw,
  Venomroar,
  Emberfuzz,
  Vineroot,
  Bublifox,
  Zaptuft,
  Psygleam,
  Sludgeprowl,
  Cinderplate,
  Terraform,
  Hydroshell,
  Zappadome,
  Mindshell,
  Pestiplate,
  Magmalore,
  Djungalore,
  Tsunalore,
  Shocklore,
  Mentalore,
  Sporelore,
}

type Config = {
  stats: {
    hp: number;
    speed: number;
    attack: number;
    defense: number;
  };
  monsters: number[];
};

const bull: Config = {
  stats: {
    hp: 20,
    speed: 20,
    attack: 30,
    defense: 30,
  },
  monsters: [
    Monster.Blazehorn,
    Monster.Foretusk,
    Monster.Aquasteer,
    Monster.Thunderhoof,
    Monster.Psyhorn,
    Monster.Toxicorn,
  ],
};

const bear: Config = {
  stats: {
    hp: 25,
    speed: 25,
    attack: 25,
    defense: 25,
  },
  monsters: [
    Monster.Flampanda,
    Monster.Verdubear,
    Monster.Wavepaw,
    Monster.Shockfur,
    Monster.Dreamgrowl,
    Monster.Poisonclaw,
  ],
};

const gorilla: Config = {
  stats: {
    hp: 40,
    speed: 10,
    attack: 30,
    defense: 20,
  },
  monsters: [
    Monster.Pyrilla,
    Monster.Florangutan,
    Monster.Tidalmonk,
    Monster.Electrang,
    Monster.Cerebrilla,
    Monster.Gloomgrip,
  ],
};

const boar: Config = {
  stats: {
    hp: 20,
    speed: 40,
    attack: 10,
    defense: 30,
  },
  monsters: [
    Monster.Fernopig,
    Monster.Leafsnout,
    Monster.Streamhog,
    Monster.Zappig,
    Monster.Enighog,
    Monster.Fumebrow,
  ],
};

const lizard: Config = {
  stats: {
    hp: 20,
    speed: 30,
    attack: 20,
    defense: 30,
  },
  monsters: [
    Monster.Firizard,
    Monster.Floralon,
    Monster.Reptide,
    Monster.Chargecrest,
    Monster.Cogniscale,
    Monster.Acidtongue,
  ],
};

const elephant: Config = {
  stats: {
    hp: 30,
    speed: 10,
    attack: 30,
    defense: 30,
  },
  monsters: [
    Monster.Magmaphant,
    Monster.Grovemaw,
    Monster.Aquarump,
    Monster.Voltusk,
    Monster.Mentolox,
    Monster.Sludgetrunk,
  ],
};

const whale: Config = {
  stats: {
    hp: 40,
    speed: 10,
    attack: 10,
    defense: 40,
  },
  monsters: [
    Monster.Flarejaw,
    Monster.Verdantide,
    Monster.Bubblestream,
    Monster.Sparkfin,
    Monster.Psycheleap,
    Monster.Slimefin,
  ],
};

const lion: Config = {
  stats: {
    hp: 20,
    speed: 40,
    attack: 20,
    defense: 20,
  },
  monsters: [
    Monster.Flamlion,
    Monster.Greenwhelp,
    Monster.Ripplemane,
    Monster.Voltmane,
    Monster.Cerebropaw,
    Monster.Venomroar,
  ],
};
const fox: Config = {
  stats: {
    hp: 10,
    speed: 40,
    attack: 40,
    defense: 10,
  },
  monsters: [
    Monster.Emberfuzz,
    Monster.Vineroot,
    Monster.Bublifox,
    Monster.Zaptuft,
    Monster.Psygleam,
    Monster.Sludgeprowl,
  ],
};
const turtle: Config = {
  stats: {
    hp: 30,
    speed: 10,
    attack: 10,
    defense: 50,
  },
  monsters: [
    Monster.Cinderplate,
    Monster.Terraform,
    Monster.Hydroshell,
    Monster.Zappadome,
    Monster.Mindshell,
    Monster.Pestiplate,
  ],
};
const dragon: Config = {
  stats: {
    hp: 20,
    speed: 20,
    attack: 40,
    defense: 20,
  },
  monsters: [
    Monster.Magmalore,
    Monster.Djungalore,
    Monster.Tsunalore,
    Monster.Shocklore,
    Monster.Mentalore,
    Monster.Sporelore,
  ],
};

const configs = [
  bull,
  bear,
  gorilla,
  boar,
  lizard,
  elephant,
  whale,
  lion,
  fox,
  turtle,
  dragon,
];
describe("MonsterStats", function () {
  let monsterCount = 0;
  let individualMonsterCount = 0;
  async function deploy() {
    const signers = await ethers.getSigners();
    const [owner] = signers;

    const MonsterApiV1 = await ethers.getContractFactory("MonsterApiV1");
    const monsterApiV1 = await MonsterApiV1.deploy();
    await monsterApiV1.waitForDeployment();
    return {
      owner,
      monsterApiV1,
    };
  }

  it("All monster stats should sum up to 500", async function () {
    const { monsterApiV1 } = await deploy();
    for (let monserId in Monster) {
      if (`${monserId}` === "0" || isNaN(parseInt(monserId))) {
        continue;
      }
      const tx = await monsterApiV1.createMonsterByName(monserId);
      await tx.wait();
      monsterCount++;
      const monster = await monsterApiV1.getMonster(monsterCount);
      const sum = monster.hp + monster.speed + monster.attack + monster.defense;
      expect(sum).to.equal(500);
    }
  });

  it("Individual monster stats should be correct", async function () {
    const baseStat = 100;
    const { monsterApiV1 } = await deploy();
    for (let config in configs) {
      const stats = configs[config].stats;
      for (let index in configs[config].monsters) {
        const monsterId = configs[config].monsters[index];
        const tx = await monsterApiV1.createMonsterByName(monsterId);
        await tx.wait();
        individualMonsterCount++;
        const monster = await monsterApiV1.getMonster(individualMonsterCount);
        expect(
          monster.hp,
          `hp to be ${stats.hp + baseStat} for monster ${monsterId}, #${index} group #${config}`,
        ).to.equal(stats.hp + baseStat);
        expect(
          monster.attack,
          `attack to be ${stats.attack + baseStat} for monster ${monsterId}, #${index} group #${config}`,
        ).to.equal(stats.attack + baseStat);
        expect(
          monster.speed,
          `speed to be ${stats.speed + baseStat} for monster ${monsterId}, #${index} group #${config}`,
        ).to.equal(stats.speed + baseStat);
        expect(
          monster.defense,
          `defense to be ${stats.defense + baseStat} for monster ${monsterId}, #${index} group #${config}`,
        ).to.equal(stats.defense + baseStat);
      }
    }
  });

  it("To have checked the same amount of total and indiviual monsters", async function () {
    expect(individualMonsterCount).to.equal(monsterCount);
  });
});
