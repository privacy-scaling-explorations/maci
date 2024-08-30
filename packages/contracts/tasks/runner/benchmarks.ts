/* eslint-disable no-console */
import { task } from "hardhat/config";
import { Keypair, PCommand } from "maci-domainobjs";

import { Deployment } from "../helpers/Deployment";
import { EContracts } from "../helpers/types";

task("benchmark", "Run benchmarks").setAction(async (_, hre) => {
  const deployment = Deployment.getInstance(hre);
  deployment.setHre(hre);

  const deployer = await deployment.getDeployer();

  // deploy MACI
  const steps = await deployment.start("full", { incremental: true, verify: false });
  await deployment.runSteps(steps, 0);

  // deploy a Poll
  // get original tree depth
  const messageTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "messageTreeDepth");
  // update it
  deployment.updateDeployConfig(EContracts.VkRegistry, "messageTreeDepth", 3);
  const pollSteps = await deployment.start("poll", { incremental: true, verify: false });
  await deployment.runSteps(pollSteps, 0);
  // restore it
  deployment.updateDeployConfig(EContracts.VkRegistry, "messageTreeDepth", messageTreeDepth);

  try {
    const startBalance = await deployer.provider.getBalance(deployer);
    const maxBatchSize = 100;

    console.log("======================================================================");
    console.log(`Starting balance: ${Number(startBalance / 10n ** 12n) / 1e6}\n`);

    // generate a message
    const keypair = new Keypair();
    const coordinatorKeypair = new Keypair();

    const command = new PCommand(1n, keypair.pubKey, 0n, 9n, 1n, 0n, 0n);
    const signature = command.sign(keypair.privKey);
    // not recommended to use the same key for the message but this is just for benchmarking
    const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinatorKeypair.pubKey);
    const message = command.encrypt(signature, sharedKey);

    const { publishBatch } = await import("../helpers/benchmarks");
    await publishBatch(deployment, message, keypair, maxBatchSize);

    const endBalance = await deployer.provider.getBalance(deployer);
    console.log(`Ending balance: ${Number(endBalance / 10n ** 12n) / 1e6}\n`);
    console.log("======================================================================");
  } catch (err) {
    console.error("\n=========================================================\nERROR:", err, "\n");
  }
});
