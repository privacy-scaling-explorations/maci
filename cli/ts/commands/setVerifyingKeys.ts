import { BaseContract } from "ethers";
import { extractVk } from "maci-circuits";
import {
  type IVerifyingKeyStruct,
  type VkRegistry,
  getDefaultSigner,
  getDefaultNetwork,
  parseArtifact,
} from "maci-contracts";
import { genProcessVkSig, genSubsidyVkSig, genTallyVkSig } from "maci-core";
import { VerifyingKey } from "maci-domainobjs";

import fs from "fs";

import {
  type SetVerifyingKeysArgs,
  info,
  logError,
  logGreen,
  logYellow,
  success,
  readContractAddress,
  contractExists,
  banner,
  compareVks,
} from "../utils";

/**
 * Function that sets the verifying keys in the VkRegistry contract
 * @note see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing
 * @param SetVerifyingKeysArgs - The arguments for the setVerifyingKeys command
 */
export const setVerifyingKeys = async ({
  stateTreeDepth,
  intStateTreeDepth,
  messageTreeDepth,
  voteOptionTreeDepth,
  messageBatchDepth,
  processMessagesZkeyPath,
  tallyVotesZkeyPath,
  vkRegistry,
  subsidyZkeyPath,
  signer,
  quiet = true,
}: SetVerifyingKeysArgs): Promise<void> => {
  banner(quiet);

  const ethSigner = signer || (await getDefaultSigner());
  const network = await getDefaultNetwork();

  // we must either have the contract as param or stored to file
  if (!readContractAddress("VkRegistry", network?.name) && !vkRegistry) {
    logError("vkRegistry contract address is empty");
  }

  const vkRegistryAddress = vkRegistry || readContractAddress("VkRegistry", network?.name);

  // check if zKey files exist
  if (!fs.existsSync(processMessagesZkeyPath)) {
    logError(`${processMessagesZkeyPath} does not exist.`);
  }

  if (!fs.existsSync(tallyVotesZkeyPath)) {
    logError(`${tallyVotesZkeyPath} does not exist.`);
  }

  if (subsidyZkeyPath && !fs.existsSync(subsidyZkeyPath)) {
    logError(`${subsidyZkeyPath} does not exist.`);
  }

  // extract the vks
  const processVk = VerifyingKey.fromObj(await extractVk(processMessagesZkeyPath));
  const tallyVk = VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPath));

  // validate args
  if (
    stateTreeDepth < 1 ||
    intStateTreeDepth < 1 ||
    messageTreeDepth < 1 ||
    voteOptionTreeDepth < 1 ||
    messageBatchDepth < 1
  ) {
    logError("Invalid depth or batch size parameters");
  }

  if (stateTreeDepth < intStateTreeDepth) {
    logError("Invalid state tree depth or intermediate state tree depth");
  }

  // Check the pm zkey filename against specified params
  const pmMatch = processMessagesZkeyPath.match(/.+_(\d+)-(\d+)-(\d+)-(\d+)/);

  if (!pmMatch) {
    logError(`${processMessagesZkeyPath} has an invalid filename`);
    return;
  }

  const pmStateTreeDepth = Number(pmMatch[1]);
  const pmMsgTreeDepth = Number(pmMatch[2]);
  const pmMsgBatchDepth = Number(pmMatch[3]);
  const pmVoteOptionTreeDepth = Number(pmMatch[4]);

  const tvMatch = tallyVotesZkeyPath.match(/.+_(\d+)-(\d+)-(\d+)/);

  if (!tvMatch) {
    logError(`${tallyVotesZkeyPath} has an invalid filename`);
    return;
  }

  const tvStateTreeDepth = Number(tvMatch[1]);
  const tvIntStateTreeDepth = Number(tvMatch[2]);
  const tvVoteOptionTreeDepth = Number(tvMatch[3]);

  if (
    stateTreeDepth !== pmStateTreeDepth ||
    messageTreeDepth !== pmMsgTreeDepth ||
    messageBatchDepth !== pmMsgBatchDepth ||
    voteOptionTreeDepth !== pmVoteOptionTreeDepth ||
    stateTreeDepth !== tvStateTreeDepth ||
    intStateTreeDepth !== tvIntStateTreeDepth ||
    voteOptionTreeDepth !== tvVoteOptionTreeDepth
  ) {
    logError("Incorrect .zkey file; please check the circuit params");
  }

  // ensure we have a contract deployed at the provided address
  if (!(await contractExists(ethSigner.provider!, vkRegistryAddress))) {
    logError(`A VkRegistry contract is not deployed at ${vkRegistryAddress}`);
  }

  // connect to VkRegistry contract
  const vkRegistryAbi = parseArtifact("VkRegistry")[0];
  const vkRegistryContract = new BaseContract(vkRegistryAddress, vkRegistryAbi, ethSigner) as VkRegistry;

  const messageBatchSize = 5 ** messageBatchDepth;

  // check if the process messages vk was already set
  const processVkSig = genProcessVkSig(stateTreeDepth, messageTreeDepth, voteOptionTreeDepth, messageBatchSize);

  if (await vkRegistryContract.isProcessVkSet(processVkSig)) {
    logError("This process verifying key is already set in the contract");
  }

  // do the same for the tally votes vk
  const tallyVkSig = genTallyVkSig(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth);

  if (await vkRegistryContract.isTallyVkSet(tallyVkSig)) {
    logError("This tally verifying key is already set in the contract");
  }

  // do the same for the subsidy vk if any
  if (subsidyZkeyPath) {
    const ssMatch = subsidyZkeyPath.match(/.+_(\d+)-(\d+)-(\d+)/);

    if (!ssMatch) {
      logError(`${subsidyZkeyPath} has an invalid filename`);
      return;
    }

    const ssStateTreeDepth = Number(ssMatch[1]);
    const ssIntStateTreeDepth = Number(ssMatch[2]);
    const ssVoteOptionTreeDepth = Number(ssMatch[3]);

    if (
      stateTreeDepth !== ssStateTreeDepth ||
      intStateTreeDepth !== ssIntStateTreeDepth ||
      voteOptionTreeDepth !== ssVoteOptionTreeDepth
    ) {
      logError("Incorrect .zkey file; please check the circuit params");
    }

    const subsidyVkSig = genSubsidyVkSig(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth);

    if (await vkRegistryContract.isSubsidyVkSet(subsidyVkSig)) {
      info("This subsidy verifying key is already set in the contract");
    }
  }

  // actually set those values
  try {
    logYellow(quiet, info("Setting verifying keys..."));
    // set them onchain
    const tx = await vkRegistryContract.setVerifyingKeys(
      stateTreeDepth,
      intStateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize,
      processVk.asContractParam() as IVerifyingKeyStruct,
      tallyVk.asContractParam() as IVerifyingKeyStruct,
    );

    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("Set verifying keys transaction failed");
    }

    logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));

    // confirm that they were actually set correctly
    const processVkOnChain = await vkRegistryContract.getProcessVk(
      stateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize,
    );

    const tallyVkOnChain = await vkRegistryContract.getTallyVk(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth);

    if (!compareVks(processVk, processVkOnChain)) {
      logError("processVk mismatch");
    }

    if (!compareVks(tallyVk, tallyVkOnChain)) {
      logError("tallyVk mismatch");
    }

    // set subsidy keys if any
    if (subsidyZkeyPath) {
      const subsidyVk = VerifyingKey.fromObj(await extractVk(subsidyZkeyPath));

      const txReceipt = await vkRegistryContract
        .setSubsidyKeys(
          stateTreeDepth,
          intStateTreeDepth,
          voteOptionTreeDepth,
          subsidyVk.asContractParam() as IVerifyingKeyStruct,
        )
        .then((transaction) => transaction.wait(2));

      if (txReceipt?.status !== 1) {
        logError("Set subsidy keys transaction failed");
      }

      logYellow(quiet, info(`Transaction hash: ${tx.hash}`));

      const subsidyVkOnChain = await vkRegistryContract.getSubsidyVk(
        stateTreeDepth,
        intStateTreeDepth,
        voteOptionTreeDepth,
      );
      if (!compareVks(subsidyVk, subsidyVkOnChain)) {
        logError("subsidyVk mismatch");
      }
    }
  } catch (error) {
    logError((error as Error).message);
  }

  logGreen(quiet, success("Verifying keys set successfully"));
};
