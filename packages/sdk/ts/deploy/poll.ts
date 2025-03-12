import {
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpGatekeeper,
  MACI__factory as MACIFactory,
  SignUpGatekeeper__factory as SignUpGatekeeperFactory,
} from "maci-contracts";
import { VOTE_OPTION_TREE_ARITY } from "maci-core";
import { PubKey } from "maci-domainobjs";

import type { IDeployPollArgs, IPollContractsData } from "./types";

import { contractExists } from "../utils";
import { parseEventFromLogs } from "../utils/contracts";

import { DEFAULT_INITIAL_VOICE_CREDITS } from "./utils";

/**
 * Deploy a poll
 * @param args - The arguments for the deploy poll command
 * @returns The addresses of the deployed contracts
 */
export const deployPoll = async ({
  maciAddress,
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
  initialVoiceCredits,
  signer,
}: IDeployPollArgs): Promise<IPollContractsData> => {
  if (!vkRegistryContractAddress) {
    throw new Error("Please provide a VkRegistry contract address");
  }

  if (!maciAddress) {
    throw new Error("Please provide a MACI contract address");
  }

  const isMaciExists = await contractExists(signer.provider!, maciAddress);

  if (!isMaciExists) {
    throw new Error("MACI contract does not exist");
  }

  const maciContract = MACIFactory.connect(maciAddress, signer);

  // check if we have a signupGatekeeper already deployed or passed as arg
  let signupGatekeeperContractAddress = gatekeeperContractAddress;

  if (!signupGatekeeperContractAddress) {
    const contract = await deployFreeForAllSignUpGatekeeper(signer, true);
    signupGatekeeperContractAddress = await contract.getAddress();
  }

  let initialVoiceCreditProxyAddress = initialVoiceCreditProxyContractAddress;

  if (!initialVoiceCreditProxyAddress) {
    const contract = await deployConstantInitialVoiceCreditProxy(
      initialVoiceCredits ?? DEFAULT_INITIAL_VOICE_CREDITS,
      signer,
      true,
    );
    initialVoiceCreditProxyAddress = await contract.getAddress();
  }

  // required arg -> poll duration
  if (pollStartTimestamp < Math.floor(Date.now() / 1000)) {
    throw new Error("Start date cannot be in the past");
  }

  if (pollEndTimestamp <= pollStartTimestamp) {
    throw new Error("End date cannot be before start date");
  }

  // required arg -> int state tree depth
  if (intStateTreeDepth <= 0) {
    throw new Error("Int state tree depth cannot be <= 0");
  }

  // required arg -> message tree depth
  if (messageBatchSize <= 0) {
    throw new Error("Message batch size cannot be <= 0");
  }
  // required arg -> vote option tree depth
  if (voteOptionTreeDepth <= 0) {
    throw new Error("Vote option tree depth cannot be <= 0");
  }

  // ensure the vote option parameter is valid (if passed)
  if (voteOptions && voteOptions > VOTE_OPTION_TREE_ARITY ** voteOptionTreeDepth) {
    throw new Error("Vote options cannot be greater than the number of leaves in the vote option tree");
  }

  // we check that the coordinator's public key is valid
  if (!PubKey.isValidSerializedPubKey(coordinatorPubKey.serialize())) {
    throw new Error("Invalid MACI public key");
  }

  const receipt = await maciContract
    .deployPoll({
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
      gatekeeper: signupGatekeeperContractAddress,
      initialVoiceCreditProxy: initialVoiceCreditProxyAddress,
      relayers,
      voteOptions,
    })
    .then((tx) => tx.wait());

  if (receipt?.status !== 1) {
    throw new Error("Deploy poll transaction is failed");
  }

  // parse DeployPoll log
  const iface = maciContract.interface;
  const log = parseEventFromLogs(receipt, iface, "DeployPoll") as unknown as {
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

  const gatekeeperContract = SignUpGatekeeperFactory.connect(signupGatekeeperContractAddress, signer);
  await gatekeeperContract.setTarget(pollContractAddress).then((tx) => tx.wait());

  return {
    pollId,
    pollContractAddress,
    messageProcessorContractAddress,
    tallyContractAddress,
    gatekeeperContractAddress: signupGatekeeperContractAddress,
    initialVoiceCreditProxyContractAddress: initialVoiceCreditProxyAddress,
  };
};
