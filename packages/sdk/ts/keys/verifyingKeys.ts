import { EMode, IVerifyingKeyStruct, VkRegistry__factory as VkRegistryFactory, extractVk } from "maci-contracts";
import { genPollJoinedVkSig, genPollJoiningVkSig, genProcessVkSig, genTallyVkSig } from "maci-core";
import { IVkContractParams, VerifyingKey } from "maci-domainobjs";

import type { IGetAllVksArgs, IExtractAllVksArgs, IMaciVks, IMaciVerifyingKeys, ISetVerifyingKeysArgs } from "./types";

import { contractExists } from "../utils";

/**
 * Get all the verifying keys from the contract
 * @param args - The arguments for the getAllVks function
 * @returns The verifying keys
 */
export const getAllOnChainVks = async ({
  vkRegistryAddress,
  signer,
  stateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
  intStateTreeDepth,
  mode,
}: IGetAllVksArgs): Promise<IMaciVerifyingKeys> => {
  const vkRegistryContractInstance = VkRegistryFactory.connect(vkRegistryAddress, signer);

  const [pollJoiningVkOnChain, pollJoinedVkOnChain, processVkOnChain, tallyVkOnChain] = await Promise.all([
    vkRegistryContractInstance.getPollJoiningVk(stateTreeDepth, voteOptionTreeDepth),
    vkRegistryContractInstance.getPollJoinedVk(stateTreeDepth, voteOptionTreeDepth),
    vkRegistryContractInstance.getProcessVk(stateTreeDepth, voteOptionTreeDepth, messageBatchSize, mode),
    vkRegistryContractInstance.getTallyVk(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth, mode),
  ]);

  return {
    pollJoiningVkOnChain,
    pollJoinedVkOnChain,
    processVkOnChain,
    tallyVkOnChain,
  };
};

/**
 * Compare two verifying keys
 * @param vkOnChain - the verifying key on chain
 * @param vk - the local verifying key
 * @returns whether they are equal or not
 */
export const compareVks = (vkOnChain: IVkContractParams, vk?: VerifyingKey): boolean => {
  if (!vk) {
    throw new Error("Verifying key is not provided");
  }

  let isEqual = vk.ic.length === vkOnChain.ic.length;
  for (let i = 0; i < vk.ic.length; i += 1) {
    isEqual = isEqual && vk.ic[i].x.toString() === vkOnChain.ic[i].x.toString();
    isEqual = isEqual && vk.ic[i].y.toString() === vkOnChain.ic[i].y.toString();
  }

  isEqual = isEqual && vk.alpha1.x.toString() === vkOnChain.alpha1.x.toString();
  isEqual = isEqual && vk.alpha1.y.toString() === vkOnChain.alpha1.y.toString();
  isEqual = isEqual && vk.beta2.x[0].toString() === vkOnChain.beta2.x[0].toString();
  isEqual = isEqual && vk.beta2.x[1].toString() === vkOnChain.beta2.x[1].toString();
  isEqual = isEqual && vk.beta2.y[0].toString() === vkOnChain.beta2.y[0].toString();
  isEqual = isEqual && vk.beta2.y[1].toString() === vkOnChain.beta2.y[1].toString();
  isEqual = isEqual && vk.delta2.x[0].toString() === vkOnChain.delta2.x[0].toString();
  isEqual = isEqual && vk.delta2.x[1].toString() === vkOnChain.delta2.x[1].toString();
  isEqual = isEqual && vk.delta2.y[0].toString() === vkOnChain.delta2.y[0].toString();
  isEqual = isEqual && vk.delta2.y[1].toString() === vkOnChain.delta2.y[1].toString();
  isEqual = isEqual && vk.gamma2.x[0].toString() === vkOnChain.gamma2.x[0].toString();
  isEqual = isEqual && vk.gamma2.x[1].toString() === vkOnChain.gamma2.x[1].toString();
  isEqual = isEqual && vk.gamma2.y[0].toString() === vkOnChain.gamma2.y[0].toString();
  isEqual = isEqual && vk.gamma2.y[1].toString() === vkOnChain.gamma2.y[1].toString();

  return isEqual;
};

/**
 * Extract all the verifying keys
 * @param args - The arguments for the extractAllVks function
 * @returns The verifying keys
 */
export const extractAllVks = async ({
  pollJoiningZkeyPath,
  pollJoinedZkeyPath,
  processMessagesZkeyPath,
  tallyVotesZkeyPath,
}: IExtractAllVksArgs): Promise<IMaciVks> => {
  // extract the vks
  const pollJoiningVk = pollJoiningZkeyPath ? VerifyingKey.fromObj(await extractVk(pollJoiningZkeyPath)) : undefined;
  const pollJoinedVk = pollJoinedZkeyPath ? VerifyingKey.fromObj(await extractVk(pollJoinedZkeyPath)) : undefined;

  const processVk = processMessagesZkeyPath
    ? VerifyingKey.fromObj(await extractVk(processMessagesZkeyPath))
    : undefined;
  const tallyVk = tallyVotesZkeyPath ? VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPath)) : undefined;

  return {
    pollJoiningVk,
    pollJoinedVk,
    processVk,
    tallyVk,
  };
};

/**
 * Set the verifying keys on the contract
 * @param args - The arguments for the setVerifyingKeys function
 */
export const setVerifyingKeys = async ({
  pollJoiningVk,
  pollJoinedVk,
  processMessagesVk,
  tallyVotesVk,
  stateTreeDepth,
  intStateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
  vkRegistryAddress,
  signer,
  mode,
}: ISetVerifyingKeysArgs): Promise<void> => {
  // validate args
  if (stateTreeDepth < 1 || intStateTreeDepth < 1 || voteOptionTreeDepth < 1 || messageBatchSize < 1) {
    throw new Error("Invalid depth or batch size parameters");
  }

  if (stateTreeDepth < intStateTreeDepth) {
    throw new Error("Invalid state tree depth or intermediate state tree depth");
  }

  const vkRegistryContractExists = await contractExists(signer.provider!, vkRegistryAddress);
  // ensure we have a contract deployed at the provided address
  if (!vkRegistryContractExists) {
    throw new Error(`A VkRegistry contract is not deployed at ${vkRegistryAddress}`);
  }

  // connect to VkRegistry contract
  const vkRegistryContract = VkRegistryFactory.connect(vkRegistryAddress, signer);

  // check if the poll vk was already set
  const pollJoiningVkSig = genPollJoiningVkSig(stateTreeDepth, voteOptionTreeDepth);

  if (await vkRegistryContract.isPollJoiningVkSet(pollJoiningVkSig)) {
    throw new Error("This poll verifying key is already set in the contract");
  }

  // check if the poll vk was already set
  const pollJoinedVkSig = genPollJoinedVkSig(stateTreeDepth, voteOptionTreeDepth);

  if (await vkRegistryContract.isPollJoinedVkSet(pollJoinedVkSig)) {
    throw new Error("This poll verifying key is already set in the contract");
  }

  // check if the process messages vk was already set
  const processVkSig = genProcessVkSig(stateTreeDepth, voteOptionTreeDepth, messageBatchSize);

  if (await vkRegistryContract.isProcessVkSet(processVkSig, EMode.QV)) {
    throw new Error("This process verifying key is already set in the contract");
  }

  // do the same for the tally votes vk
  const tallyVkSig = genTallyVkSig(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth);

  if (await vkRegistryContract.isTallyVkSet(tallyVkSig, mode)) {
    throw new Error("This tally verifying key is already set in the contract");
  }

  // set them onchain
  const tx = await vkRegistryContract.setVerifyingKeysBatch(
    stateTreeDepth,
    intStateTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
    [mode],
    pollJoiningVk.asContractParam() as IVerifyingKeyStruct,
    pollJoinedVk.asContractParam() as IVerifyingKeyStruct,
    [processMessagesVk.asContractParam() as IVerifyingKeyStruct],
    [tallyVotesVk.asContractParam() as IVerifyingKeyStruct],
  );

  const receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error("Set verifying keys transaction failed");
  }

  const [pollJoiningVkOnChain, pollJoinedVkOnChain, processVkOnChain, tallyVkOnChain] = await Promise.all([
    vkRegistryContract.getPollJoiningVk(stateTreeDepth, voteOptionTreeDepth),
    vkRegistryContract.getPollJoinedVk(stateTreeDepth, voteOptionTreeDepth),
    vkRegistryContract.getProcessVk(stateTreeDepth, voteOptionTreeDepth, messageBatchSize, mode),
    vkRegistryContract.getTallyVk(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth, mode),
  ]);

  if (!compareVks(pollJoiningVkOnChain, pollJoiningVk)) {
    throw new Error("pollJoiningVk mismatch");
  }

  if (!compareVks(pollJoinedVkOnChain, pollJoinedVk)) {
    throw new Error("pollJoinedVk mismatch");
  }

  if (!compareVks(processVkOnChain, processMessagesVk)) {
    throw new Error("processVk mismatch");
  }

  if (!compareVks(tallyVkOnChain, tallyVotesVk)) {
    throw new Error("tallyVk mismatch");
  }
};
