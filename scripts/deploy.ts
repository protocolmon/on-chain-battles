import { ethers, upgrades } from "hardhat";
import fs from "fs";

async function deployContract(factoryName: string, args: any = []) {
  console.log(`Deploying ${factoryName}...`);
  const Factory = await ethers.getContractFactory(factoryName);
  const instance = await Factory.deploy(...args);
  const address = await instance.getAddress();
  console.log(`${factoryName} deployed to:`, address);
  return { instance, address };
}

async function deployProxy(factoryName: string, args: any = []) {
  console.log(`Deploying ${factoryName}...`);
  const Factory = await ethers.getContractFactory(factoryName);
  const instance = await upgrades.deployProxy(Factory, args);
  const address = await instance.getAddress();
  console.log(`${factoryName} deployed to:`, address);
  return { instance, address };
}

async function main() {
  const output: any = {
    contracts: {},
    attacks: {},
    effects: {},
  };

  const { address: monsterApiV1Address } = await deployContract("MonsterApiV1");
  const { address: moveExecutorV1Address } =
    await deployContract("MoveExecutorV1");

  output.contracts.MonsterApiV1 = monsterApiV1Address;
  output.contracts.MoveExecutorV1 = moveExecutorV1Address;

  const { address: matchMakerV2Address } = await deployProxy("MatchMakerV2", [
    monsterApiV1Address,
    moveExecutorV1Address,
    86400, // 1 day in seconds
  ]);

  output.contracts.MatchMakerV2 = matchMakerV2Address;

  const { address: damageOverTimeEffectAddress } = await deployContract(
    "DamageOverTimeEffect",
  );
  const { address: damageOverTimeMoveAddress } = await deployContract(
    "DamageOverTimeMove",
    [damageOverTimeEffectAddress, 50],
  );
  const { address: foggedEffectAddress } = await deployContract("FoggedEffect");
  const { address: controlMoveAddress } = await deployContract("ControlMove", [
    foggedEffectAddress,
  ]);
  const { address: purgeBuffsMoveAddress } = await deployContract(
    "PurgeBuffsMove",
    [50],
  );
  const { address: wallBreakerMoveAddress } =
    await deployContract("WallBreakerMove");

  const { address: cleansingShieldMoveAddress } = await deployContract(
    "CleansingShieldMove",
  );
  const { address: cloudCoverEffectAddress } = await deployContract(
    "CloudCoverEffect",
    [40],
  );
  const { address: cloudCoverMoveAddress } = await deployContract(
    "CloudCoverMove",
    [cloudCoverEffectAddress],
  );
  const { address: elementalWallEffectAddress } = await deployContract(
    "ElementalWallEffect",
    [wallBreakerMoveAddress],
  );
  const { address: elementalWallMoveAddress } = await deployContract(
    "ElementalWallMove",
    [elementalWallEffectAddress],
  );
  const { address: tailwindEffectAddress } =
    await deployContract("TailwindEffect");
  const { address: tailwindMoveAddress } = await deployContract(
    "TailwindMove",
    [tailwindEffectAddress],
  );

  const { address: attackAuraEffectAddress } =
    await deployContract("AttackAuraEffect");
  const { address: attackAuraMoveAddress } = await deployContract(
    "AttackAuraMove",
    [attackAuraEffectAddress],
  );

  const { address: defenseAuraEffectAddress } =
    await deployContract("DefenseAuraEffect");
  const { address: defenseAuraMoveAddress } = await deployContract(
    "DefenseAuraMove",
    [defenseAuraEffectAddress],
  );

  const { address: healMoveAddress } = await deployContract("HealMove");

  const { address: speedAuraEffectAddress } =
    await deployContract("SpeedAuraEffect");
  const { address: speedAuraMoveAddress } = await deployContract(
    "SpeedAuraMove",
    [speedAuraEffectAddress],
  );

  output.effects.DamageOverTimeEffect = damageOverTimeEffectAddress;
  output.attacks.DamageOverTimeMove = damageOverTimeMoveAddress;
  output.effects.FoggedEffect = foggedEffectAddress;
  output.attacks.ControlMove = controlMoveAddress;
  output.attacks.PurgeBuffsMove = purgeBuffsMoveAddress;
  output.attacks.WallBreakerMove = wallBreakerMoveAddress;
  output.attacks.CleansingShieldMove = cleansingShieldMoveAddress;
  output.effects.CloudCoverEffect = cloudCoverEffectAddress;
  output.attacks.CloudCoverMove = cloudCoverMoveAddress;
  output.effects.ElementalWallEffect = elementalWallEffectAddress;
  output.attacks.ElementalWallMove = elementalWallMoveAddress;
  output.effects.TailwindEffect = tailwindEffectAddress;
  output.attacks.TailwindMove = tailwindMoveAddress;
  output.effects.AttackAuraEffect = attackAuraEffectAddress;
  output.attacks.AttackAuraMove = attackAuraMoveAddress;
  output.effects.DefenseAuraEffect = defenseAuraEffectAddress;
  output.attacks.DefenseAuraMove = defenseAuraMoveAddress;
  output.attacks.HealMove = healMoveAddress;
  output.effects.SpeedAuraEffect = speedAuraEffectAddress;
  output.attacks.SpeedAuraMove = speedAuraMoveAddress;

  // Writing to a JSON file
  fs.writeFileSync(
    `${__dirname}/../cli/contracts.generated.json`,
    JSON.stringify(output, null, 2),
  );

  console.log("All addresses have been written to deployed_contracts.json");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
