import { generateTreeCommitment, hash2, hash3, hashLeftRight } from "@maci-protocol/crypto";

import type { IGenerateTallyCommitmentsArgs, ITallyCommitments } from "./types";

/**
 * Generate the tally commitments for this current batch of proving
 * @param tallyData - The tally data
 * @param voteOptionTreeDepth - The vote option tree depth
 * @returns The commitments to the Tally data
 */
export const generateTallyCommitments = ({
  tallyData,
  voteOptionTreeDepth,
}: IGenerateTallyCommitmentsArgs): ITallyCommitments => {
  // compute newResultsCommitment
  const newResultsCommitment = generateTreeCommitment(
    tallyData.results.tally.map((x) => BigInt(x)),
    BigInt(tallyData.results.salt),
    voteOptionTreeDepth,
  );

  // compute newSpentVoiceCreditsCommitment
  const newSpentVoiceCreditsCommitment = hash2([
    BigInt(tallyData.totalSpentVoiceCredits.spent),
    BigInt(tallyData.totalSpentVoiceCredits.salt),
  ]);

  let newTallyCommitment: bigint;
  let newPerVOSpentVoiceCreditsCommitment: bigint | undefined;

  if (tallyData.isQuadratic) {
    // compute newPerVOSpentVoiceCreditsCommitment
    newPerVOSpentVoiceCreditsCommitment = generateTreeCommitment(
      tallyData.perVoteOptionSpentVoiceCredits!.tally.map((x) => BigInt(x)),
      BigInt(tallyData.perVoteOptionSpentVoiceCredits!.salt),
      voteOptionTreeDepth,
    );

    // compute newTallyCommitment
    newTallyCommitment = hash3([
      newResultsCommitment,
      newSpentVoiceCreditsCommitment,
      newPerVOSpentVoiceCreditsCommitment,
    ]);
  } else {
    newTallyCommitment = hashLeftRight(newResultsCommitment, newSpentVoiceCreditsCommitment);
  }

  return {
    newTallyCommitment,
    newSpentVoiceCreditsCommitment,
    newPerVOSpentVoiceCreditsCommitment,
    newResultsCommitment,
  };
};
