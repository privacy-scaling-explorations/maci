/* eslint-disable no-console */
import { ZeroAddress } from "ethers";
import { task, types } from "hardhat/config";

import type { AccQueue, MACI, Poll } from "../../typechain-types";

import { Deployment } from "../helpers/Deployment";
import { TreeMerger } from "../helpers/TreeMerger";
import { EContracts, type IMergeParams } from "../helpers/types";

const DEFAULT_SR_QUEUE_OPS = 4;

/**
 * Command to merge signup and message queues of a MACI contract
 */
task("merge", "Merge signups and messages")
  .addParam("poll", "The poll id", undefined, types.string)
  .addOptionalParam("queueOps", "The number of queue operations to perform", DEFAULT_SR_QUEUE_OPS, types.int)
  .addOptionalParam("prove", "Run prove command after merging", false, types.boolean)
  .setAction(async ({ poll, prove, queueOps = DEFAULT_SR_QUEUE_OPS }: IMergeParams, hre) => {
    const deployment = Deployment.getInstance(hre);

    deployment.setHre(hre);

    const deployer = await deployment.getDeployer();

    const maciContract = await deployment.getContract<MACI>({ name: EContracts.MACI });

    const pollContracts = await maciContract.polls(poll);
    const pollContract = await deployment.getContract<Poll>({ name: EContracts.Poll, address: pollContracts.poll });
    const [, messageAccQueueContractAddress] = await pollContract.extContracts();

    const messageAccQueueContract = await deployment.getContract<AccQueue>({
      name: EContracts.AccQueue,
      address: messageAccQueueContractAddress,
    });

    if (pollContracts.poll === ZeroAddress) {
      throw new Error(`No poll ${poll} found`);
    }

    const treeMerger = new TreeMerger({
      deployer,
      pollContract,
      messageAccQueueContract,
    });

    const startBalance = await deployer.provider.getBalance(deployer);

    console.log("Start balance: ", Number(startBalance / 10n ** 12n) / 1e6);

    await treeMerger.checkPollDuration();

    await treeMerger.mergeSignups();
    await treeMerger.mergeMessageSubtrees(queueOps);
    await treeMerger.mergeMessages();

    const endBalance = await deployer.provider.getBalance(deployer);

    console.log("End balance: ", Number(endBalance / 10n ** 12n) / 1e6);
    console.log("Merge expenses: ", Number((startBalance - endBalance) / 10n ** 12n) / 1e6);

    if (prove) {
      console.log(`Prove poll ${poll} results`);
      await hre.run("prove");
    }
  });
