import { BaseContract } from "ethers";
import { extractVk } from "maci-circuits";
import { type VkRegistry, getDefaultSigner, getDefaultNetwork, parseArtifact } from "maci-contracts";
import { G1Point, G2Point } from "maci-crypto";
import { VerifyingKey } from "maci-domainobjs";

import fs from "fs";

import {
  CheckVerifyingKeysArgs,
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
 * @note see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing
 * @param CheckVerifyingKeysArgs - The arguments for the checkVerifyingKeys command
 * @returns Whether the verifying keys match or not
 */
export const checkVerifyingKeys = async ({
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
}: CheckVerifyingKeysArgs): Promise<boolean> => {
  banner(quiet);
  // get the signer
  const ethSigner = signer || (await getDefaultSigner());
  const network = await getDefaultNetwork();

  // ensure we have the contract addresses that we need
  if (!readContractAddress("VkRegistry", network?.name) && !vkRegistry) {
    logError("Please provide a VkRegistry contract address");
  }

  const vkContractAddress = vkRegistry || readContractAddress("VkRegistry", network?.name);

  if (!(await contractExists(ethSigner.provider!, vkContractAddress))) {
    logError("The VkRegistry contract does not exist");
  }

  const vkRegistryContractInstance = new BaseContract(
    vkContractAddress,
    parseArtifact("VkRegistry")[0],
    ethSigner,
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
