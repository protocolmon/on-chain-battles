import contracts from "../contracts.generated.json";

export const monsters = [
  "Blazehorn (Fire Bull)",
  "Foretusk (Nature Bull)",
  "Aquasteer (Water Bull)",
  "Flampanda (Fire Bear)",
  "Verdubear (Nature Bear)",
  "Wavepaw (Water Bear)",
  "Pyrilla (Fire Gorilla)",
  "Florangutan (Nature Gorilla)",
  "Tidalmonk (Water Gorilla)",
  "Fernopig (Fire Boar)",
  "Leafsnout (Nature Boar)",
  "Streamhog (Water Boar)",
];

export const monsterIds = new Map(
  monsters.map((monster, index) => [monster, index + 1]),
);

export const attacks = {
  "Damage: Control": contracts.attacks.ControlMove,
  "Damage: Damage Over Time": contracts.attacks.DamageOverTimeMove,
  "Damage: Purge Buffs Attack": contracts.attacks.PurgeBuffsMove,
  "Damage: Wall Breaker Attack": contracts.attacks.WallBreakerMove,
  "Shield: Cleansing Shield": contracts.attacks.CleansingShieldMove,
  "Shield: Cloud Cover": contracts.attacks.CloudCoverMove,
  "Shield: Elemental Wall": contracts.attacks.ElementalWallMove,
  "Shield: Tailwind": contracts.attacks.TailwindMove,
  "Boost: Attack Aura": contracts.attacks.AttackAuraMove,
  "Boost: Defense Aura": contracts.attacks.DefenseAuraMove,
  "Boost: Heal": contracts.attacks.HealMove,
  "Boost: Speed Aura": contracts.attacks.SpeedAuraMove,
};

export const effects = {
  "Debuff: Damage Over Time": contracts.effects.DamageOverTimeEffect,
  "Debuff: Fogged": contracts.effects.FoggedEffect,
  "Buff: Cloud Cover": contracts.effects.CloudCoverEffect,
  "Buff: Elemental Wall": contracts.effects.ElementalWallEffect,
  "Buff: Tailwind": contracts.effects.TailwindEffect,
  "Buff: Attack Aura": contracts.effects.AttackAuraEffect,
  "Buff: Defense Aura": contracts.effects.DefenseAuraEffect,
  "Buff: Speed Aura Boost": contracts.effects.SpeedAuraEffect,
};

export const translateMoveByAddress = (move: string) => {
  for (const [name, address] of Object.entries(attacks)) {
    if (address === move) {
      return name;
    }
  }

  return move;
};

export const translateEffectByAddress = (effect: string) => {
  for (const [name, address] of Object.entries(effects)) {
    if (address === effect) {
      return name;
    }
  }

  return effect;
};

export const translateElement = (element: number) => {
  switch (element) {
    case 0:
      return "None";
    case 1:
      return "Electric";
    case 2:
      return "Fire";
    case 3:
      return "Water";
    case 4:
      return "Mental";
    case 5:
      return "Nature";
    case 6:
      return "Toxic";
    default:
      return "Unknown";
  }
};
