import {
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpPolicy,
  FreeForAllCheckerFactory__factory as FreeForAllCheckerFactoryFactory,
  FreeForAllPolicyFactory__factory as FreeForAllPolicyFactoryFactory,
  MACI__factory as MACIFactory,
  IBasePolicy__factory as SignUpPolicyFactory,
} from "@maci-protocol/contracts";
import { VOTE_OPTION_TREE_ARITY } from "@maci-protocol/core";
import { PublicKey } from "@maci-protocol/domainobjs";

import type { IDeployPollArgs, IPollContractsData } from "./types";

import { contractExists } from "../utils/contracts";

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
  tallyProcessingStateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
  stateTreeDepth,
  coordinatorPublicKey,
  verifierContractAddress,
  verifyingKeysRegistryContractAddress,
  mode,
  policyContractAddress,
  initialVoiceCreditProxyContractAddress,
  relayers,
  voteOptions,
  initialVoiceCredits,
  freeForAllCheckerFactoryAddress,
  freeForAllPolicyFactoryAddress,
  signer,
}: IDeployPollArgs): Promise<IPollContractsData> => {
  if (!verifyingKeysRegistryContractAddress) {
    throw new Error("Please provide a VerifyingKeysRegistry contract address");
  }

  if (!maciAddress) {
    throw new Error("Please provide a MACI contract address");
  }

  const isMaciExists = await contractExists(signer.provider!, maciAddress);

  if (!isMaciExists) {
    throw new Error("MACI contract does not exist");
  }

  const maciContract = MACIFactory.connect(maciAddress, signer);

  // check if we have a signupPolicy already deployed or passed as arg
  let signupPolicyContractAddress = policyContractAddress;

  if (!signupPolicyContractAddress) {
    const checkerFactory = freeForAllCheckerFactoryAddress
      ? FreeForAllCheckerFactoryFactory.connect(freeForAllCheckerFactoryAddress, signer)
      : undefined;

    const policyFactory = freeForAllPolicyFactoryAddress
      ? FreeForAllPolicyFactoryFactory.connect(freeForAllPolicyFactoryAddress, signer)
      : undefined;

    const [contract] = await deployFreeForAllSignUpPolicy(
      { checker: checkerFactory, policy: policyFactory },
      signer,
      true,
    );
    signupPolicyContractAddress = await contract.getAddress();
  }

  let initialVoiceCreditProxyAddress = initialVoiceCreditProxyContractAddress;

  if (!initialVoiceCreditProxyAddress) {
    const [contract] = await deployConstantInitialVoiceCreditProxy(
      { amount: initialVoiceCredits ?? DEFAULT_INITIAL_VOICE_CREDITS },
      signer,
      undefined,
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
  if (tallyProcessingStateTreeDepth <= 0) {
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
  if (!PublicKey.isValidSerialized(coordinatorPublicKey.serialize())) {
    throw new Error("Invalid MACI public key");
  }

  const receipt = await maciContract
    .deployPoll({
      startDate: pollStartTimestamp,
      endDate: pollEndTimestamp,
      treeDepths: {
        tallyProcessingStateTreeDepth,
        voteOptionTreeDepth,
        stateTreeDepth,
      },
      messageBatchSize,
      coordinatorPublicKey: coordinatorPublicKey.asContractParam(),
      verifier: verifierContractAddress,
      verifyingKeysRegistry: verifyingKeysRegistryContractAddress,
      mode,
      policy: signupPolicyContractAddress,
      initialVoiceCreditProxy: initialVoiceCreditProxyAddress,
      relayers,
      voteOptions,
    })
    .then((tx) => tx.wait());

  if (receipt?.status !== 1) {
    throw new Error("Deploy poll transaction is failed");
  }

  // parse DeployPoll log
  const events = await maciContract.queryFilter(
    maciContract.filters.DeployPoll,
    receipt.blockNumber,
    receipt.blockNumber,
  );
  const log = events[events.length - 1];

  // eslint-disable-next-line no-underscore-dangle
  const pollId = log.args._pollId;
  const pollContracts = await maciContract.getPoll(pollId);
  const pollContractAddress = pollContracts.poll;
  const messageProcessorContractAddress = pollContracts.messageProcessor;
  const tallyContractAddress = pollContracts.tally;

  const policyContract = SignUpPolicyFactory.connect(signupPolicyContractAddress, signer);
  await policyContract.setTarget(pollContractAddress).then((tx) => tx.wait());

  return {
    pollId,
    pollContractAddress,
    messageProcessorContractAddress,
    tallyContractAddress,
    policyContractAddress: signupPolicyContractAddress,
    initialVoiceCreditProxyContractAddress: initialVoiceCreditProxyAddress,
  };
};
