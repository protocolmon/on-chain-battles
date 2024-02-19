import { Signer } from "ethers";
import { EventLoggerV1, MoveExecutorV1 } from "../../typechain-types";
import { ethers } from "hardhat";

export async function deployAttacks(
  deployer: Signer,
  logger: EventLoggerV1,
  moveExecutorV1: MoveExecutorV1,
) {
  const DamageOverTimeEffect = await ethers.getContractFactory(
    "DamageOverTimeEffect",
  );
  const damageOverTimeEffect = await DamageOverTimeEffect.deploy();
  await damageOverTimeEffect.setLogger(await logger.getAddress());
  await damageOverTimeEffect.addExecutor(await moveExecutorV1.getAddress());
  await damageOverTimeEffect.addExecutor(await deployer.getAddress());
  await logger.addWriter(await damageOverTimeEffect.getAddress());

  const DamageOverTimeMove =
    await ethers.getContractFactory("DamageOverTimeMove");
  const damageOverTimeMove = await DamageOverTimeMove.deploy(
    await damageOverTimeEffect.getAddress(),
    100,
  );
  await damageOverTimeMove.setLogger(await logger.getAddress());
  await damageOverTimeMove.addExecutor(await moveExecutorV1.getAddress());
  await damageOverTimeMove.addExecutor(await deployer.getAddress());
  await logger.addWriter(await damageOverTimeMove.getAddress());

  const FoggedEffect = await ethers.getContractFactory("FoggedEffect");
  const foggedEffect = await FoggedEffect.deploy();
  await foggedEffect.setLogger(await logger.getAddress());
  await foggedEffect.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await foggedEffect.getAddress());

  const ControlMove = await ethers.getContractFactory("ControlMove");
  const controlMove = await ControlMove.deploy(await foggedEffect.getAddress());
  await controlMove.setLogger(await logger.getAddress());
  await controlMove.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await controlMove.getAddress());

  const CloudCoverEffect = await ethers.getContractFactory("CloudCoverEffect");
  const cloudCoverEffect = await CloudCoverEffect.deploy(0);
  await cloudCoverEffect.setLogger(await logger.getAddress());
  await cloudCoverEffect.addExecutor(await moveExecutorV1.getAddress());
  await cloudCoverEffect.addExecutor(await deployer.getAddress());
  await logger.addWriter(await cloudCoverEffect.getAddress());

  const CloudCoverMove = await ethers.getContractFactory("CloudCoverMove");
  const cloudCoverMove = await CloudCoverMove.deploy(
    await cloudCoverEffect.getAddress(),
  );
  await cloudCoverMove.setLogger(await logger.getAddress());
  await cloudCoverMove.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await cloudCoverMove.getAddress());

  const SpeedAuraEffect = await ethers.getContractFactory("SpeedAuraEffect");
  const speedAuraEffect = await SpeedAuraEffect.deploy();
  await speedAuraEffect.setLogger(await logger.getAddress());
  await speedAuraEffect.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await speedAuraEffect.getAddress());

  const SpeedAuraMove = await ethers.getContractFactory("SpeedAuraMove");
  const speedAuraMove = await SpeedAuraMove.deploy(
    await speedAuraEffect.getAddress(),
  );
  await speedAuraMove.setLogger(await logger.getAddress());
  await speedAuraMove.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await speedAuraMove.getAddress());

  const AttackAuraEffect = await ethers.getContractFactory("AttackAuraEffect");
  const attackAuraEffect = await AttackAuraEffect.deploy();
  await attackAuraEffect.setLogger(await logger.getAddress());
  await attackAuraEffect.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await attackAuraEffect.getAddress());

  const AttackAuraMove = await ethers.getContractFactory("AttackAuraMove");
  const attackAuraMove = await AttackAuraMove.deploy(
    await attackAuraEffect.getAddress(),
  );
  await attackAuraMove.setLogger(await logger.getAddress());
  await attackAuraMove.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await attackAuraMove.getAddress());

  const DefenseAuraEffect =
    await ethers.getContractFactory("DefenseAuraEffect");
  const defenseAuraEffect = await DefenseAuraEffect.deploy();
  await defenseAuraEffect.setLogger(await logger.getAddress());
  await defenseAuraEffect.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await defenseAuraEffect.getAddress());

  const DefenseAuraMove = await ethers.getContractFactory("DefenseAuraMove");
  const defenseAuraMove = await DefenseAuraMove.deploy(
    await defenseAuraEffect.getAddress(),
  );
  await defenseAuraMove.setLogger(await logger.getAddress());
  await defenseAuraMove.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await defenseAuraMove.getAddress());

  const HealMove = await ethers.getContractFactory("HealMove");
  const healMove = await HealMove.deploy();
  await healMove.setLogger(await logger.getAddress());
  await healMove.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await healMove.getAddress());

  const PurgeBuffsMove = await ethers.getContractFactory("PurgeBuffsMove");
  const purgeBuffsMove = await PurgeBuffsMove.deploy(100);
  await purgeBuffsMove.setLogger(await logger.getAddress());
  await purgeBuffsMove.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await purgeBuffsMove.getAddress());

  const ConfusedEffect = await ethers.getContractFactory("ConfusedEffect");
  const confusedEffect = await ConfusedEffect.deploy();
  await confusedEffect.setLogger(await logger.getAddress());
  await confusedEffect.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await confusedEffect.getAddress());

  const WallBreakerMove = await ethers.getContractFactory("WallBreakerMove");
  const wallBreakerMove = await WallBreakerMove.deploy(
    await confusedEffect.getAddress(),
    80,
  );
  await wallBreakerMove.setLogger(await logger.getAddress());
  await wallBreakerMove.addExecutor(await moveExecutorV1.getAddress());
  await wallBreakerMove.addExecutor(await deployer.getAddress());
  await logger.addWriter(await wallBreakerMove.getAddress());

  const ElementalWallEffect = await ethers.getContractFactory(
    "ElementalWallEffect",
  );
  const elementalWallEffect = await ElementalWallEffect.deploy(
    await wallBreakerMove.getAddress(),
  );
  await elementalWallEffect.setLogger(await logger.getAddress());
  await elementalWallEffect.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await elementalWallEffect.getAddress());

  const ElementalWallMove =
    await ethers.getContractFactory("ElementalWallMove");
  const elementalWallMove = await ElementalWallMove.deploy(
    await elementalWallEffect.getAddress(),
  );
  await elementalWallMove.setLogger(await logger.getAddress());
  await elementalWallMove.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await elementalWallMove.getAddress());

  const TailwindEffect = await ethers.getContractFactory("TailwindEffect");
  const tailwindEffect = await TailwindEffect.deploy();
  await tailwindEffect.setLogger(await logger.getAddress());
  await tailwindEffect.addExecutor(await moveExecutorV1.getAddress());
  await tailwindEffect.addExecutor(await damageOverTimeMove.getAddress());
  await tailwindEffect.addExecutor(await purgeBuffsMove.getAddress());
  await tailwindEffect.addExecutor(await wallBreakerMove.getAddress());
  await tailwindEffect.addExecutor(await controlMove.getAddress());
  await logger.addWriter(await tailwindEffect.getAddress());

  const TailwindMove = await ethers.getContractFactory("TailwindMove");
  const tailwindMove = await TailwindMove.deploy(
    await tailwindEffect.getAddress(),
  );
  await tailwindMove.setLogger(await logger.getAddress());
  await tailwindMove.addExecutor(await moveExecutorV1.getAddress());
  await logger.addWriter(await tailwindMove.getAddress());

  const CleansingShieldMove = await ethers.getContractFactory(
    "CleansingShieldMove",
  );
  const cleansingShieldMove = await CleansingShieldMove.deploy();
  await cleansingShieldMove.setLogger(await logger.getAddress());
  await cleansingShieldMove.addExecutor(await moveExecutorV1.getAddress());
  await cleansingShieldMove.addExecutor(await deployer.getAddress());
  await logger.addWriter(await cleansingShieldMove.getAddress());

  return {
    damageOverTimeAttack: damageOverTimeMove,
    cloudCoverMove: cloudCoverMove,
    attackAuraMove: attackAuraMove,
    defenseAuraMove: defenseAuraMove,
    speedAuraMove: speedAuraMove,
    controlEffect: foggedEffect,
    defenseAuraEffect,
    cloudCoverEffect,
    healMove,
    purgeBuffsMove,
    speedAuraEffect,
    damageOverTimeEffect,
    controlMove,
    wallBreakerMove,
    elementalWallEffect,
    elementalWallMove,
    tailwindMove,
    cleansingShieldMove,
  };
}
