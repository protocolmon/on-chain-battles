import { MonsterApiV1 } from "../../typechain-types";

const ELEMENTS = {
  ELECTRIC: 1,
  FIRE: 2,
  WATER: 3,
  MENTAL: 4,
  NATURE: 5,
  TOXIC: 6,
};

export async function createMockMonsters(monsterApi: MonsterApiV1) {
  // two of each type
  for (const id of ["1", "2"]) {
    await monsterApi.createMonster(id, ELEMENTS.FIRE, 100, 100, 100, 100, id);
  }

  for (const id of ["3", "4"]) {
    await monsterApi.createMonster(id, ELEMENTS.WATER, 100, 100, 100, 100, id);
  }

  for (const id of ["5", "6"]) {
    await monsterApi.createMonster(id, ELEMENTS.NATURE, 100, 100, 100, 100, id);
  }
}
