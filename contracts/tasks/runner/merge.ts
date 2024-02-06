/* eslint-disable no-console */
import { BaseContract, ZeroAddress } from "ethers";
import { task, types } from "hardhat/config";

import { parseArtifact } from "../../ts/abi";
import { ContractStorage } from "../helpers/ContractStorage";
import { Deployment } from "../helpers/Deployment";
import { TreeMerger } from "../helpers/TreeMerger";
import { EContracts, type MACI, type IMergeParams, type Poll, type StateAq } from "../helpers/types";

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
    const storage = ContractStorage.getInstance();

    deployment.setHre(hre);

    const deployer = await deployment.getDeployer();
    const { network } = hre;

    const maciContractAddress = storage.mustGetAddress(EContracts.MACI, network.name);
    const [maciContractAbi] = parseArtifact("MACI");
    const [accQueueContractAbi] = parseArtifact("AccQueue");
    const [pollContractAbi] = parseArtifact("Poll");

    const maciContract = new BaseContract(maciContractAddress, maciContractAbi, deployer) as MACI;
    const signupAccQueueContractAddress = await maciContract.stateAq();

    const pollContractAddress = await maciContract.polls(poll);
    const pollContract = new BaseContract(pollContractAddress, pollContractAbi, deployer) as Poll;
    const [, messageAccQueueContractAddress] = await pollContract.extContracts();

    const signupAccQueueContract = new BaseContract(
      signupAccQueueContractAddress,
      accQueueContractAbi,
      deployer,
    ) as StateAq;

    const messageAccQueueContract = new BaseContract(
      messageAccQueueContractAddress,
      accQueueContractAbi,
      deployer,
    ) as StateAq;

    if (!pollContractAddress || pollContractAddress === ZeroAddress) {
      throw new Error(`No poll ${poll} found`);
    }

    const treeMerger = new TreeMerger({
      deployer,
      pollContract,
      signupAccQueueContract,
      maciContract,
      messageAccQueueContract,
    });

    const startBalance = await deployer.provider.getBalance(deployer);

    console.log("Start balance: ", Number(startBalance / 10n ** 12n) / 1e6);

    await treeMerger.checkPollOwner();
    await treeMerger.checkPollDuration();

    await treeMerger.mergeSignupSubtrees(poll, queueOps);
    await treeMerger.mergeSignups(poll);

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
