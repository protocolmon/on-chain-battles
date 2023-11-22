import { Address } from "viem";
import contracts from "../../cli/contracts.generated.json";

const statusEffectsReversed = Object.fromEntries(
  Object.entries(contracts.effects).map(([key, value]) => [value, key]),
);

const movesReversed = Object.fromEntries(
  Object.entries(contracts.attacks).map(([key, value]) => [value, key]),
);

export class EventLog {
  id: bigint;
  name: string;
  timestamp: bigint;

  constructor(id: bigint, name: string, timestamp: bigint) {
    this.id = id;
    this.name = name;
    this.timestamp = timestamp;
  }
}

class AddStatusEffectLog extends EventLog {
  static INTERFACE = "address,uint256,uint256";
  static ON_CHAIN_NAME = BigInt(1);

  monsterId: bigint;
  monsterName: string;
  statusEffect: string;
  remainingTurns: bigint;

  constructor(
    id: bigint,
    name: string,
    timestamp: bigint,
    [statusEffect, monsterId, remainingTurns]: [Address, bigint, bigint],
  ) {
    super(id, name, timestamp);

    this.statusEffect = statusEffectsReversed[statusEffect];
    this.monsterId = monsterId;
    this.monsterName = "";
    this.remainingTurns = remainingTurns;
  }
}

class ApplyMonsterStatusEffectLog extends EventLog {
  static INTERFACE = "address,uint256,uint256";
  static ON_CHAIN_NAME = BigInt(2);

  monsterId: bigint;
  monsterName: string;
  statusEffect: string;
  extraData: bigint;

  constructor(
    id: bigint,
    name: string,
    timestamp: bigint,
    [statusEffect, monsterId, extraData]: [Address, bigint, bigint],
  ) {
    super(id, name, timestamp);
    this.statusEffect = statusEffectsReversed[statusEffect];
    this.monsterId = monsterId;
    this.monsterName = "";
    this.extraData = extraData;
  }
}

class ApplyMoveStatusEffectLog extends EventLog {
  static INTERFACE = "address,address,bool";
  static ON_CHAIN_NAME = BigInt(3);

  move: Address;
  statusEffect: string;
  isHit: boolean;

  constructor(
    id: bigint,
    name: string,
    timestamp: bigint,
    [statusEffect, move, isHit]: [Address, Address, boolean],
  ) {
    super(id, name, timestamp);
    this.statusEffect = statusEffectsReversed[statusEffect];
    this.move = move;
    this.isHit = isHit;
  }
}

class ApplyOtherStatusEffectLog extends EventLog {
  static INTERFACE = "address,bool";
  static ON_CHAIN_NAME = BigInt(4);

  statusEffect: string;
  isHit: boolean;

  constructor(
    id: bigint,
    name: string,
    timestamp: bigint,
    [statusEffect, isHit]: [Address, boolean],
  ) {
    super(id, name, timestamp);
    this.statusEffect = statusEffectsReversed[statusEffect];
    this.isHit = isHit;
  }
}

class DamageLog extends EventLog {
  static INTERFACE = "address,uint256,uint256,uint256,uint256,bool";
  static ON_CHAIN_NAME = BigInt(5);

  move: string;
  attacker: bigint;
  defender: bigint;
  damage: bigint;
  elementalMultiplier: bigint;
  isCritical: boolean;

  constructor(
    id: bigint,
    name: string,
    timestamp: bigint,
    [move, attacker, defender, damage, elementalMultiplier, isCritical]: [
      Address,
      bigint,
      bigint,
      bigint,
      bigint,
      boolean,
    ],
  ) {
    super(id, name, timestamp);
    this.move = movesReversed[move];
    this.attacker = attacker;
    this.defender = defender;
    this.damage = damage;
    this.elementalMultiplier = elementalMultiplier;
    this.isCritical = isCritical;
  }
}

class HealLog extends EventLog {
  static INTERFACE = "address,uint256,uin256";
  static ON_CHAIN_NAME = BigInt(6);

  move: string;
  monsterId: bigint;
  monsterName: string;
  heal: bigint;

  constructor(
    id: bigint,
    name: string,
    timestamp: bigint,
    [move, monsterId, heal]: [Address, bigint, bigint],
  ) {
    super(id, name, timestamp);
    this.move = movesReversed[move];
    this.monsterId = monsterId;
    this.monsterName = "";
    this.heal = heal;
  }
}

class RemoveStatusEffectsByGroupLog extends EventLog {
  static INTERFACE = "address,uint256,uint256";
  static ON_CHAIN_NAME = BigInt(7);

  move: string;
  monsterId: bigint;
  monsterName: string;
  group: bigint;

  constructor(
    id: bigint,
    name: string,
    timestamp: bigint,
    [move, monsterId, group]: [Address, bigint, bigint],
  ) {
    super(id, name, timestamp);
    this.move = movesReversed[move];
    this.monsterId = monsterId;
    this.monsterName = "";
    this.group = group;
  }
}

class CommitMoveLog extends EventLog {
  static INTERFACE = "address,bytes32";
  static ON_CHAIN_NAME = BigInt(1_000_000);

  player: Address;
  commit: string;

  constructor(
    id: bigint,
    name: string,
    timestamp: bigint,
    [player, commit]: [Address, string],
  ) {
    super(id, name, timestamp);
    this.player = player;
    this.commit = commit;
  }
}

class RevealMoveLog extends EventLog {
  static INTERFACE = "address,address";
  static ON_CHAIN_NAME = BigInt(1_000_001);

  player: Address;
  move: string;

  constructor(
    id: bigint,
    name: string,
    timestamp: bigint,
    [player, move]: [Address, Address],
  ) {
    super(id, name, timestamp);
    this.player = player;
    this.move = movesReversed[move];
  }
}

class FirstStrikerLog extends EventLog {
  static INTERFACE = "uint256";
  static ON_CHAIN_NAME = BigInt(1_000_002);

  monsterId: bigint;
  monsterName: string;

  constructor(
    id: bigint,
    name: string,
    timestamp: bigint,
    [monsterId]: [bigint],
  ) {
    super(id, name, timestamp);
    this.monsterId = monsterId;
    this.monsterName = "";
  }
}

class GameOverLog extends EventLog {
  static INTERFACE = "address";
  static ON_CHAIN_NAME = BigInt(1_000_003);

  winner: Address;

  constructor(
    id: bigint,
    name: string,
    timestamp: bigint,
    [winner]: [Address],
  ) {
    super(id, name, timestamp);
    this.winner = winner;
  }
}

export const eventLogClasses = [
  AddStatusEffectLog,
  ApplyMonsterStatusEffectLog,
  ApplyMoveStatusEffectLog,
  ApplyOtherStatusEffectLog,
  DamageLog,
  HealLog,
  RemoveStatusEffectsByGroupLog,
  CommitMoveLog,
  RevealMoveLog,
  FirstStrikerLog,
  GameOverLog,
];
