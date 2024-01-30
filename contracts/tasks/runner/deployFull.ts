/* eslint-disable no-console */
import { task, types } from "hardhat/config";

import { exit } from "process";

import type { IDeployParams } from "../helpers/types";

import { ContractStorage } from "../helpers/ContractStorage";
import { Deployment } from "../helpers/Deployment";

/**
 * Main deployment task which runs deploy steps in the same order that `Deployment#deployTask` is called.
 * Note: you probably need to use indicies for deployment step files to support the correct order.
 */
task("deploy-full", "Deploy environment")
  .addFlag("incremental", "Incremental deployment")
  .addFlag("strict", "Fail on warnings")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addOptionalParam("skip", "Skip steps with less or equal index", 0, types.int)
  .addOptionalParam("amount", "The amount of initial voice credit to give to each user", undefined, types.int)
  .addOptionalParam("stateTreeDepth", "The depth of the state tree", 10, types.int)
  .setAction(async ({ incremental, strict, verify, amount, skip = 0, stateTreeDepth = 10 }: IDeployParams, hre) => {
    const deployment = Deployment.getInstance(hre);
    const storage = ContractStorage.getInstance();

    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();
    const startBalance = await deployer.provider.getBalance(deployer);
    const deployerAddress = await deployer.getAddress();

    let success = false;

    try {
      console.log("Deployer address:", deployerAddress);
      console.log("Deployer start balance: ", startBalance / 10n ** 18n);

      if (incremental) {
        console.log("======================================================================");
        console.log("======================================================================");
        console.log("====================    ATTENTION! INCREMENTAL MODE    ===============");
        console.log("======================================================================");
        console.log("=========== Delete 'deployed-contracts.json' to start a new ==========");
        console.log("======================================================================");
        console.log("======================================================================");
      } else {
        storage.cleanup(hre.network.name);
      }

      console.log("Deployment started\n");
      const steps = await deployment.getDeploySteps("full", {
        incremental,
        verify,
        amount,
        stateTreeDepth,
      });

      // eslint-disable-next-line no-restricted-syntax
      for (const step of steps) {
        const stepId = `0${step.id}`;
        console.log("\n======================================================================");
        console.log(stepId.slice(stepId.length - 2), step.name);
        console.log("======================================================================\n");

        if (step.id <= skip) {
          console.log(`STEP ${step.id} WAS SKIPPED`);
        } else {
          // eslint-disable-next-line no-await-in-loop
          await hre.run(step.taskName, step.args);
        }
      }

      const [entryMap, instanceCount, multiCount] = storage.printContracts(deployerAddress, hre.network.name);

      let hasWarn = false;

      if (multiCount > 0) {
        console.warn("WARNING: multi-deployed contract(s) detected");
        hasWarn = true;
      } else if (entryMap.size !== instanceCount) {
        console.warn("WARNING: unknown contract(s) detected");
        hasWarn = true;
      }

      entryMap.forEach((_, key) => {
        if (key.startsWith("Mock")) {
          console.warn("WARNING: mock contract detected:", key);
          hasWarn = true;
        }
      });

      if (hasWarn && strict) {
        throw new Error("Warnings are present");
      }

      success = true;
    } catch (err) {
      console.error("\n=========================================================\nERROR:", err, "\n");
    }

    const { gasPrice } = hre.network.config;
    const endBalance = await deployer.provider.getBalance(deployer);

    console.log("======================================================================");
    console.log("Deployer end balance: ", Number(endBalance / 10n ** 12n) / 1e6);
    console.log("Deploy expenses: ", Number((startBalance - endBalance) / 10n ** 12n) / 1e6);

    if (gasPrice !== "auto") {
      console.log("Deploy gas: ", Number(startBalance - endBalance) / gasPrice, "@", gasPrice / 1e9, " gwei");
    }

    console.log("======================================================================");

    if (!success) {
      console.log("\nDeployment has failed");
      exit(1);
    }

    console.log("\nDeployment has finished");

    if (verify) {
      console.log("Verify all contracts");
      await hre.run("verify-full");
    }
  });
