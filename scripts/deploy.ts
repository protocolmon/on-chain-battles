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

  const { address: contractApiV1Address } =
    await deployContract("ContractApiV1");
  output.contracts.ContractApiV1 = contractApiV1Address;

  const { address: monsterApiV1Address } = await deployContract("MonsterApiV1");
  const { address: moveExecutorV1Address } =
    await deployContract("MoveExecutorV1");

  output.contracts.MonsterApiV1 = monsterApiV1Address;
  output.contracts.MoveExecutorV1 = moveExecutorV1Address;

  const EventEmitterV1 = await ethers.getContractFactory("EventEmitterV1");
  const eventEmitterV1 = await EventEmitterV1.deploy();

  output.contracts.EventEmitterV1 = await eventEmitterV1.getAddress();

  const { address: matchMakerV2Address } = await deployProxy("MatchMakerV2", [
    monsterApiV1Address,
    moveExecutorV1Address,
    86400, // 1 day in seconds
  ]);

  output.contracts.MatchMakerV2 = matchMakerV2Address;

  const ConfusedEffect = await ethers.getContractFactory("ConfusedEffect");
  const confusedEffect = await ConfusedEffect.deploy();

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
  const { address: wallBreakerMoveAddress } = await deployContract(
    "WallBreakerMove",
    [await confusedEffect.getAddress()],
  );

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

  const { address: confusedControlMove } = await deployContract(
    "ConfusedControlMove",
    [controlMoveAddress],
  );
  await confusedEffect.addConfusedMove(controlMoveAddress, confusedControlMove);

  const { address: confusedDamageOverTimeMove } = await deployContract(
    "ConfusedDamageOverTimeMove",
    [damageOverTimeMoveAddress],
  );
  await confusedEffect.addConfusedMove(
    damageOverTimeMoveAddress,
    confusedDamageOverTimeMove,
  );

  const { address: confusedPurgeBuffsMove } = await deployContract(
    "ConfusedPurgeBuffsMove",
    [purgeBuffsMoveAddress],
  );
  await confusedEffect.addConfusedMove(
    purgeBuffsMoveAddress,
    confusedPurgeBuffsMove,
  );

  const { address: confusedWallBreakerMove } = await deployContract(
    "ConfusedWallBreakerMove",
    [wallBreakerMoveAddress],
  );
  await confusedEffect.addConfusedMove(
    wallBreakerMoveAddress,
    confusedWallBreakerMove,
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
  output.effects.ConfusedEffect = await confusedEffect.getAddress();

  // iterate through all attacks and effects and set the event emitter
  for (const key of Object.keys(output.attacks)) {
    console.log(`Setting event emitter for ${key}...`);
    const attackContract = await ethers.getContractAt(key, output.attacks[key]);
    await attackContract.setEventEmitter(await eventEmitterV1.getAddress());
  }

  for (const key of Object.keys(output.effects)) {
    console.log(`Setting event emitter for ${key}...`);
    const effectContract = await ethers.getContractAt(key, output.effects[key]);
    await effectContract.setEventEmitter(await eventEmitterV1.getAddress());
  }

  // Writing to a JSON file
  fs.writeFileSync(
    `${__dirname}/../cli/contracts.generated.json`,
    JSON.stringify(output, null, 2),
  );

  // iterate through the generated contracts and register them all on the contract api
  const contractApiV1 = await ethers.getContractAt(
    "ContractApiV1",
    contractApiV1Address,
  );
  for (const key of Object.keys(output)) {
    for (const subKey of Object.keys(output[key])) {
      console.log(`Registering ${subKey} at contract api...`);
      await contractApiV1.setContract(
        parseInt(process.env.VERSION || "0"),
        subKey,
        output[key][subKey],
      );
    }
  }

  console.log("All addresses have been written to deployed_contracts.json");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
