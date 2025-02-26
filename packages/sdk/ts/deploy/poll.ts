import { MACI__factory as MACIFactory } from "maci-contracts";

import type { IDeployPollArgs, IPollContractsData } from "./types";

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
}: IDeployPollArgs): Promise<IPollContractsData> => {
  const maciContract = MACIFactory.connect(maciContractAddress, signer);

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

  const iface = maciContract.interface;
  const receiptLog = receipt.logs[receipt.logs.length - 1];

  // parse DeployPoll log
  const log = iface.parseLog(receiptLog as unknown as { topics: string[]; data: string }) as unknown as {
    args: {
      _pollId: bigint;
    };
    name: string;
  };

  // we are trying to get the poll id from the event logs
  // if we do not find this log then we throw
  if (log.name !== "DeployPoll") {
    throw new Error("Invalid event log");
  }

  // eslint-disable-next-line no-underscore-dangle
  const pollId = log.args._pollId;

  const pollContracts = await maciContract.getPoll(pollId);
  const pollContractAddress = pollContracts.poll;
  const messageProcessorContractAddress = pollContracts.messageProcessor;
  const tallyContractAddress = pollContracts.tally;

  return {
    pollId,
    pollContractAddress,
    messageProcessorContractAddress,
    tallyContractAddress,
    gatekeeperContractAddress,
    initialVoiceCreditProxyContractAddress,
  };
};
