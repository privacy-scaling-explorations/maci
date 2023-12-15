import { getDefaultSigner, parseArtifact } from "maci-contracts";
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
} from "../utils/";
import { VerifyingKey } from "maci-domainobjs";
import { extractVk } from "maci-circuits";
import { existsSync } from "fs";
import { Contract } from "ethers";

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
  if (!readContractAddress("VkRegistry") && !vkRegistry) logError("Please provide a VkRegistry contract address");
  const vkContractAddress = vkRegistry ? vkRegistry : readContractAddress("VkRegistry");
  if (!(await contractExists(signer.provider, vkContractAddress))) logError("The VkRegistry contract does not exist");

  const vkRegistryContractInstance = new Contract(vkContractAddress, parseArtifact("VkRegistry")[0], signer);

  // we need to ensure that the zkey files exist
  if (!existsSync(processMessagesZkeyPath)) logError("The provided Process messages zkey does not exist");
  if (!existsSync(tallyVotesZkeyPath)) logError("The provided Tally votes zkey does not exist");

  // extract the verification keys from the zkey files
  const processVk = VerifyingKey.fromObj(await extractVk(processMessagesZkeyPath));
  const tallyVk = VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPath));

  // check the subsidy key
  let subsidyVk: VerifyingKey;
  if (subsidyZkeyPath) {
    if (!existsSync(subsidyZkeyPath)) logError("The provided Subsidy zkey does not exist");
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

    let subsidyVkOnChain: VerifyingKey;
    if (subsidyVk)
      subsidyVkOnChain = await vkRegistryContractInstance.getSubsidyVk(
        stateTreeDepth,
        intStateTreeDepth,
        voteOptionTreeDepth,
      );

    // do the actual validation
    if (!compareVks(processVk, processVkOnChain)) logError("Process verifying keys do not match");
    if (!compareVks(tallyVk, tallyVkOnChain)) logError("Tally verifying keys do not match");
    if (subsidyVk && !compareVks(subsidyVk, subsidyVkOnChain)) logError("Subsidy verifying keys do not match");
  } catch (error: any) {
    logError(error.message);
  }

  logGreen(quiet, success("Verifying keys match"));

  return true;
};
