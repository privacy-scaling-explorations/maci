import { generateTreeProof } from "@maci-protocol/crypto";

import type { ITallyData } from "./types";
import type { Tally } from "@maci-protocol/contracts";

/**
 * Loop through each per vote option spent voice credits and verify it on-chain
 *
 * @param tallyContract The tally contract
 * @param tallyData The tally.json file data
 * @param voteOptionTreeDepth The vote option tree depth
 * @param newSpentVoiceCreditsCommitment The total spent voice credits commitment
 * @param newResultsCommitment The tally result commitment
 * @returns list of the indexes of the tally result that failed on-chain verification
 */
export const verifyPerVoteOptionSpentVoiceCredits = async (
  tallyContract: Tally,
  tallyData: ITallyData,
  voteOptionTreeDepth: number,
  newSpentVoiceCreditsCommitment: bigint,
  newResultsCommitment: bigint,
): Promise<number[]> => {
  const failedIndices: number[] = [];

  for (let i = 0; i < tallyData.perVoteOptionSpentVoiceCredits!.tally.length; i += 1) {
    const proof = generateTreeProof(
      i,
      tallyData.perVoteOptionSpentVoiceCredits!.tally.map((x) => BigInt(x)),
      voteOptionTreeDepth,
    );

    // eslint-disable-next-line no-await-in-loop
    const isValid = await tallyContract.verifyPerVoteOptionSpentVoiceCredits(
      i,
      tallyData.perVoteOptionSpentVoiceCredits!.tally[i],
      proof,
      tallyData.perVoteOptionSpentVoiceCredits!.salt,
      voteOptionTreeDepth,
      newSpentVoiceCreditsCommitment,
      newResultsCommitment,
    );

    if (!isValid) {
      failedIndices.push(i);
    }
  }

  return failedIndices;
};

/**
 * Loop through each tally result and verify it on-chain
 * @param tallyContract The tally contract
 * @param tallyData The tally.json file data
 * @param voteOptionTreeDepth The vote option tree depth
 * @param newSpentVoiceCreditsCommitment The total spent voice credits commitment
 * @param newPerVoteOptionSpentVoiceCreditsCommitment The per vote option voice credits commitment
 * @returns list of the indexes of the tally result that failed on-chain verification
 */
export const verifyTallyResults = async (
  tallyContract: Tally,
  tallyData: ITallyData,
  voteOptionTreeDepth: number,
  newSpentVoiceCreditsCommitment: bigint,
  newPerVoteOptionSpentVoiceCreditsCommitment?: bigint,
): Promise<number[]> => {
  const failedIndices: number[] = [];

  for (let i = 0; i < tallyData.results.tally.length; i += 1) {
    const proof = generateTreeProof(
      i,
      tallyData.results.tally.map((x) => BigInt(x)),
      voteOptionTreeDepth,
    );

    // eslint-disable-next-line no-await-in-loop
    const isValid = await tallyContract.verifyTallyResult(
      i,
      tallyData.results.tally[i],
      proof,
      tallyData.results.salt,
      voteOptionTreeDepth,
      newSpentVoiceCreditsCommitment,
      newPerVoteOptionSpentVoiceCreditsCommitment ?? 0n,
    );

    if (!isValid) {
      failedIndices.push(i);
    }
  }

  return failedIndices;
};
