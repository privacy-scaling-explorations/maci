/* eslint-disable no-console */
import { task, types } from "hardhat/config";

import type { IDeployParams } from "../helpers/types";

import { Deployment } from "../helpers/Deployment";

/**
 * Poll deployment task which runs deploy steps in the same order that `Deployment#deployTask` is called.
 * Note: you probably need to use indices for deployment step files to support the correct order.
 * Make sure you run `deploy-full` task before running `deploy-poll` and have deploy-config.json (see deploy-config-example.json).
 */
task("deploy-poll", "Deploy poll")
  .addFlag("incremental", "Incremental deployment")
  .addFlag("strict", "Fail on warnings")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addOptionalParam("skip", "Skip steps with less or equal index", 0, types.int)
  .setAction(async ({ strict, verify, skip = 0 }: IDeployParams, hre) => {
    const deployment = Deployment.getInstance(hre);

    deployment.setHre(hre);

    const deployer = await deployment.getDeployer();
    const startBalance = await deployer.provider.getBalance(deployer);
    let success = false;

    try {
      const steps = await deployment.start("poll", { incremental: true, verify });

      await deployment.runSteps(steps, skip);

      await deployment.checkResults(strict);

      success = true;
    } catch (err) {
      console.error("\n=========================================================\nERROR:", err, "\n");
    }

    await deployment.finish(startBalance, success);

    if (verify) {
      console.log("Verify all contracts");
      await hre.run("verify-full");
    }
  });
