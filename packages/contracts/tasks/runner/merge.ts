/* eslint-disable no-console */
import { ZeroAddress } from "ethers";
import { task, types } from "hardhat/config";

import type { MACI, Poll } from "../../typechain-types";

import { info, logMagenta } from "../../ts/logger";
import { Deployment } from "../helpers/Deployment";
import { TreeMerger } from "../helpers/TreeMerger";
import { EContracts, type IMergeParams } from "../helpers/types";

/**
 * Command to merge signups of a MACI contract
 */
task("merge", "Merge signups")
  .addParam("poll", "The poll id", undefined, types.string)
  .addOptionalParam("prove", "Run prove command after merging", false, types.boolean)
  .setAction(async ({ poll, prove }: IMergeParams, hre) => {
    const deployment = Deployment.getInstance({ hre });

    deployment.setHre(hre);

    const deployer = await deployment.getDeployer();

    const maciContract = await deployment.getContract<MACI>({ name: EContracts.MACI });

    const pollContracts = await maciContract.polls(poll);

    if (pollContracts.poll === ZeroAddress) {
      throw new Error(`No poll ${poll} found`);
    }

    const pollContract = await deployment.getContract<Poll>({
      name: EContracts.Poll,
      address: pollContracts.poll,
    });

    const treeMerger = new TreeMerger({
      deployer,
      pollContract,
    });
    const startBalance = await deployer.provider!.getBalance(deployer);

    logMagenta({ text: info(`Start balance: ${Number(startBalance / 10n ** 12n) / 1e6}`) });

    await treeMerger.checkPollDuration();

    await treeMerger.mergeSignups();

    const endBalance = await deployer.provider!.getBalance(deployer);

    logMagenta({ text: info(`End balance: ${Number(endBalance / 10n ** 12n) / 1e6}`) });
    logMagenta({ text: info(`Merge expenses: ${Number((startBalance - endBalance) / 10n ** 12n) / 1e6}`) });

    if (prove) {
      logMagenta({ text: info(`Prove poll ${poll} results`) });
      await hre.run("prove");
    }
  });
