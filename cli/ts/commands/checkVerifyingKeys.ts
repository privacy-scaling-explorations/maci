import { BaseContract } from "ethers";
import { extractVk } from "maci-circuits";
import { type VkRegistry, getDefaultSigner, parseArtifact } from "maci-contracts";
import { G1Point, G2Point } from "maci-crypto";
import { VerifyingKey } from "maci-domainobjs";

import fs from "fs";

import {
  banner,
  compareVks,
  contractExists,
  info,
  logError,
  logGreen,
  logYellow,
  readContractAddress,
  success,
} from "../utils";

/**
 * Command to confirm that the verifying keys in the contract match the
 * local ones
 * @param stateTreeDepth the depth of the state tree
 * @param intStateTreeDepth the depth of the state subtree
 * @param messageTreeDepth the depth of the message tree
 * @param voteOptionTreeDepth the depth of the vote option tree
 * @param messageBatchDepth the depth of the message batch tree
 * @param processMessagesZkeyPath the path to the process messages zkey
 * @param tallyVotesZkeyPath the path to the tally votes zkey
 * @param quiet whether to log the output
 * @param vkRegistry the address of the VkRegistry contract
 * @returns whether the verifying keys match or not
 */
export const checkVerifyingKeys = async (
  stateTreeDepth: number,
  intStateTreeDepth: number,
  messageTreeDepth: number,
  voteOptionTreeDepth: number,
  messageBatchDepth: number,
  processMessagesZkeyPath: string,
  tallyVotesZkeyPath: string,
  vkRegistry?: string,
  subsidyZkeyPath?: string,
  quiet = true,
): Promise<boolean> => {
  banner(quiet);
  // get the signer
  const signer = await getDefaultSigner();

  // ensure we have the contract addresses that we need
  if (!readContractAddress("VkRegistry") && !vkRegistry) {
    logError("Please provide a VkRegistry contract address");
  }
  const vkContractAddress = vkRegistry || readContractAddress("VkRegistry");

  if (!(await contractExists(signer.provider!, vkContractAddress))) {
    logError("The VkRegistry contract does not exist");
  }

  const vkRegistryContractInstance = new BaseContract(
    vkContractAddress,
    parseArtifact("VkRegistry")[0],
    signer,
  ) as VkRegistry;

  // we need to ensure that the zkey files exist
  if (!fs.existsSync(processMessagesZkeyPath)) {
    logError("The provided Process messages zkey does not exist");
  }

  if (!fs.existsSync(tallyVotesZkeyPath)) {
    logError("The provided Tally votes zkey does not exist");
  }

  // extract the verification keys from the zkey files
  const processVk = VerifyingKey.fromObj(await extractVk(processMessagesZkeyPath));
  const tallyVk = VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPath));

  // check the subsidy key
  let subsidyVk: VerifyingKey | undefined;
  if (subsidyZkeyPath) {
    if (!fs.existsSync(subsidyZkeyPath)) {
      logError("The provided Subsidy zkey does not exist");
    }
    subsidyVk = VerifyingKey.fromObj(await extractVk(subsidyZkeyPath));
  }

  try {
    logYellow(quiet, info("Retrieving verifying keys from the contract..."));
    // retrieve the verifying keys from the contract
    const messageBatchSize = 5 ** messageBatchDepth;

    const processVkOnChain = await vkRegistryContractInstance.getProcessVk(
      stateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize,
    );

    const tallyVkOnChain = await vkRegistryContractInstance.getTallyVk(
      stateTreeDepth,
      intStateTreeDepth,
      voteOptionTreeDepth,
    );

    let subsidyVkOnChain: VerifyingKey | undefined;

    if (subsidyVk) {
      subsidyVkOnChain = await vkRegistryContractInstance
        .getSubsidyVk(stateTreeDepth, intStateTreeDepth, voteOptionTreeDepth)
        .then(
          ({ alpha1, beta2, gamma2, delta2, ic }) =>
            new VerifyingKey(
              new G1Point(alpha1.x, alpha1.y),
              new G2Point(beta2.x, beta2.y),
              new G2Point(gamma2.x, gamma2.y),
              new G2Point(delta2.x, delta2.y),
              ic.map(({ x, y }) => new G1Point(x, y)),
            ),
        );
    }

    // do the actual validation
    if (!compareVks(processVk, processVkOnChain)) {
      logError("Process verifying keys do not match");
    }

    if (!compareVks(tallyVk, tallyVkOnChain)) {
      logError("Tally verifying keys do not match");
    }

    if (subsidyVk && !compareVks(subsidyVk, subsidyVkOnChain!)) {
      logError("Subsidy verifying keys do not match");
    }
  } catch (error) {
    logError((error as Error).message);
  }

  logGreen(quiet, success("Verifying keys match"));

  return true;
};
