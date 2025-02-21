import { MACI__factory as MACIFactory } from "maci-contracts";

import type { IDeployPollArgs, IPollContracts } from "./types";

/**
 * Deploy a poll
 * @param args - The arguments for the deploy poll command
 * @returns The addresses of the deployed contracts
 */
export const deployPoll = async ({
  maciContractAddress,
  pollStartTimestamp,
  pollEndTimestamp,
  intStateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
  coordinatorPubKey,
  verifierContractAddress,
  vkRegistryContractAddress,
  mode,
  gatekeeperContractAddress,
  initialVoiceCreditProxyContractAddress,
  relayers,
  voteOptions,
  signer,
}: IDeployPollArgs): Promise<IPollContracts> => {
  const maciContract = MACIFactory.connect(maciContractAddress, signer);

  const pollId = await maciContract.nextPollId();

  const tx = await maciContract.deployPoll({
    startDate: pollStartTimestamp,
    endDate: pollEndTimestamp,
    treeDepths: {
      intStateTreeDepth,
      voteOptionTreeDepth,
    },
    messageBatchSize,
    coordinatorPubKey: coordinatorPubKey.asContractParam(),
    verifier: verifierContractAddress,
    vkRegistry: vkRegistryContractAddress,
    mode,
    gatekeeper: gatekeeperContractAddress,
    initialVoiceCreditProxy: initialVoiceCreditProxyContractAddress,
    relayers,
    voteOptions,
  });

  const receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error("Deploy poll transaction is failed");
  }

  const pollContracts = await maciContract.getPoll(pollId);
  const pollContractAddress = pollContracts.poll;
  const messageProcessorContractAddress = pollContracts.messageProcessor;
  const tallyContractAddress = pollContracts.tally;

  return {
    pollContractAddress,
    messageProcessorContractAddress,
    tallyContractAddress,
  };
};
