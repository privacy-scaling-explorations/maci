import { extractVk } from "maci-circuits";

import fs from "fs";

import { ExtractVkToFileArgs } from "../utils/interfaces";

/**
 * Command to confirm that the verifying keys in the contract match the
 * local ones
 * @note see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing
 * @param CheckVerifyingKeysArgs - The arguments for the checkVerifyingKeys command
 * @returns Whether the verifying keys match or not
 */
export const extractVkToFile = async ({
  processMessagesZkeyPathQv,
  tallyVotesZkeyPathQv,
  processMessagesZkeyPathNonQv,
  tallyVotesZkeyPathNonQv,
  outputFilePath,
}: ExtractVkToFileArgs): Promise<void> => {
  const [processVkQv, tallyVkQv, processVkNonQv, tallyVkNonQv] = await Promise.all([
    extractVk(processMessagesZkeyPathQv),
    extractVk(tallyVotesZkeyPathQv),
    extractVk(processMessagesZkeyPathNonQv),
    extractVk(tallyVotesZkeyPathNonQv),
  ]);

  await fs.promises.writeFile(outputFilePath, JSON.stringify({ processVkQv, tallyVkQv, processVkNonQv, tallyVkNonQv }));
};
