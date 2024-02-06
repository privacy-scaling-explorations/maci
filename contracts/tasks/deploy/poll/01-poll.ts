/* eslint-disable no-console */
import { BaseContract } from "ethers";
import { PubKey } from "maci-domainobjs";

import { parseArtifact } from "../../../ts/abi";
import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, type MACI, type Poll, type StateAq, type TDeployPollParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment.deployTask("poll:deploy-poll", "Deploy poll").setAction(async (_, hre) => {
  deployment.setHre(hre);
  const deployer = await deployment.getDeployer();

  const maciContractAddress = storage.getAddress(EContracts.MACI, hre.network.name);
  const verifierContractAddress = storage.getAddress(EContracts.Verifier, hre.network.name);
  const vkRegistryContractAddress = storage.getAddress(EContracts.VkRegistry, hre.network.name);

  if (!maciContractAddress) {
    throw new Error("Need to deploy MACI contract first");
  }

  if (!verifierContractAddress) {
    throw new Error("Need to deploy Verifier contract first");
  }

  if (!vkRegistryContractAddress) {
    throw new Error("Need to deploy VkRegistry contract first");
  }

  const [maciAbi] = parseArtifact("MACI");
  const maciContract = new BaseContract(maciContractAddress, maciAbi, deployer) as MACI;
  const pollId = await maciContract.nextPollId();
  const stateAqContractAddress = await maciContract.stateAq();

  const [stateAqAbi] = parseArtifact("AccQueue");
  const stateAq = new BaseContract(stateAqContractAddress, stateAqAbi, deployer) as StateAq;
  const isTreeMerged = await stateAq.treeMerged();

  if (pollId > 0n && !isTreeMerged) {
    console.log("Previous poll is not completed");
    return;
  }

  const coordinatorPubkey = deployment.getDeployConfigField<string>(EContracts.Poll, "coordinatorPubkey");
  const pollDuration = deployment.getDeployConfigField<number>(EContracts.Poll, "pollDuration");
  const intStateTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "intStateTreeDepth");
  const messageTreeSubDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "messageBatchDepth");
  const messageTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "messageTreeDepth");
  const voteOptionTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "voteOptionTreeDepth");
  const subsidyEnabled = deployment.getDeployConfigField<boolean | null>(EContracts.Poll, "subsidyEnabled") ?? false;
  const unserializedKey = PubKey.deserialize(coordinatorPubkey);

  const deployPollParams: TDeployPollParams = [
    pollDuration,
    {
      intStateTreeDepth,
      messageTreeSubDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
    },
    unserializedKey.asContractParam(),
    verifierContractAddress,
    vkRegistryContractAddress,
    subsidyEnabled,
  ];

  const [pollAddress] = await maciContract.deployPoll.staticCall(...deployPollParams);
  const tx = await maciContract.deployPoll(...deployPollParams);
  const receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error("Deploy poll transaction is failed");
  }

  const [pollAbi] = parseArtifact("Poll");
  const pollContract = new BaseContract(pollAddress, pollAbi, deployer) as Poll;
  const [maxValues, extContracts] = await Promise.all([pollContract.maxValues(), pollContract.extContracts()]);

  await storage.register({
    id: EContracts.Poll,
    key: pollId,
    contract: pollContract,
    args: [
      pollDuration,
      maxValues.map((value) => value.toString()),
      {
        intStateTreeDepth,
        messageTreeSubDepth,
        messageTreeDepth,
        voteOptionTreeDepth,
      },
      unserializedKey.asContractParam(),
      extContracts,
    ],
    network: hre.network.name,
  });
});
