import { Tally__factory as TallyFactory, MACI__factory as MACIFactory } from "maci-contracts/typechain-types";

import type { VerifyArgs } from "./utils/types";

import { contractExists } from "./utils/contracts";
import { verifyPerVOSpentVoiceCredits, verifyTallyResults } from "./utils/verifiers";

/**
 * Verify the results of a poll on-chain
 * @param VerifyArgs - The arguments for the verify command
 */
export const verify = async ({
  pollId,
  tallyData,
  signer,
  tallyCommitments,
  numVoteOptions,
  voteOptionTreeDepth,
}: VerifyArgs): Promise<boolean> => {
  const useQv = tallyData.isQuadratic;
  const maciContractAddress = tallyData.maci;

  const validContract = await contractExists(signer.provider!, maciContractAddress);
  if (!validContract) {
    throw new Error(`There is no MACI contract deployed at ${maciContractAddress}.`);
  }

  // get the contract objects
  const maciContract = MACIFactory.connect(maciContractAddress, signer);
  const pollContracts = await maciContract.polls(pollId);
  const tallyContract = TallyFactory.connect(pollContracts.tally, signer);

  // get the on-chain tally commitment\
  const onChainTallyCommitment = BigInt(await tallyContract.tallyCommitment());

  // check the results commitment
  const validResultsCommitment = tallyData.newTallyCommitment.match(/0x[a-fA-F0-9]+/);

  if (!validResultsCommitment) {
    throw new Error("Invalid results commitment format");
  }

  if (tallyData.results.tally.length !== numVoteOptions) {
    throw new Error("Wrong number of vote options.");
  }

  // destructure the tally commitments
  const {
    newTallyCommitment,
    newSpentVoiceCreditsCommitment,
    newPerVOSpentVoiceCreditsCommitment,
    newResultsCommitment,
  } = tallyCommitments;

  // verify that the results commitment matches the output of genTreeCommitment()
  if (onChainTallyCommitment !== newTallyCommitment) {
    throw new Error("The on-chain tally commitment does not match.");
  }

  // verify total spent voice credits on-chain
  const verified = await tallyContract.verifySpentVoiceCredits(
    tallyData.totalSpentVoiceCredits.spent,
    tallyData.totalSpentVoiceCredits.salt,
    newResultsCommitment,
    newPerVOSpentVoiceCreditsCommitment ?? 0n,
  );

  if (!verified) {
    throw new Error("The on-chain verification of total spent voice credits failed.");
  }

  // verify tally result on-chain for each vote option
  const failedPerVOSpentCredits = await verifyTallyResults(
    tallyContract,
    tallyData,
    voteOptionTreeDepth,
    newSpentVoiceCreditsCommitment,
    newPerVOSpentVoiceCreditsCommitment,
  );

  if (failedPerVOSpentCredits.length > 0) {
    throw new Error(
      `At least one spent voice credits entry in the tally results failed the on-chain verification. Please check your tally results at these indexes: ${failedPerVOSpentCredits.join(
        ", ",
      )}`,
    );
  }

  if (!useQv) {
    return true;
  }

  if (tallyData.perVOSpentVoiceCredits?.tally.length !== numVoteOptions) {
    throw new Error("Wrong number of vote options.");
  }
  // verify per vote option voice credits on-chain
  const failedSpentCredits = await verifyPerVOSpentVoiceCredits(
    tallyContract,
    tallyData,
    voteOptionTreeDepth,
    newSpentVoiceCreditsCommitment,
    newResultsCommitment,
  );

  if (failedSpentCredits.length > 0) {
    throw new Error(
      `At least one tally result failed the on-chain verification. Please check your Tally data at these indexes: ${failedSpentCredits.join(
        ", ",
      )}`,
    );
  }

  return true;
};
