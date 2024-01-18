import { genTreeProof } from "maci-crypto";

import type { TallyData } from "./interfaces";
import type { Tally } from "maci-contracts";

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
export const verifyPerVOSpentVoiceCredits = async (
  tallyContract: Tally,
  tallyData: TallyData,
  voteOptionTreeDepth: number,
  newSpentVoiceCreditsCommitment: bigint,
  newResultsCommitment: bigint,
): Promise<number[]> => {
  const failedIndices: number[] = [];

  for (let i = 0; i < tallyData.perVOSpentVoiceCredits.tally.length; i += 1) {
    const proof = genTreeProof(
      i,
      tallyData.perVOSpentVoiceCredits.tally.map((x) => BigInt(x)),
      voteOptionTreeDepth,
    );

    // eslint-disable-next-line no-await-in-loop
    const isValid = await tallyContract.verifyPerVOSpentVoiceCredits(
      i,
      tallyData.perVOSpentVoiceCredits.tally[i],
      proof,
      tallyData.perVOSpentVoiceCredits.salt,
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
 * @param newPerVOSpentVoiceCreditsCommitment The per vote option voice credits commitment
 * @returns list of the indexes of the tally result that failed on-chain verification
 */
export const verifyTallyResults = async (
  tallyContract: Tally,
  tallyData: TallyData,
  voteOptionTreeDepth: number,
  newSpentVoiceCreditsCommitment: bigint,
  newPerVOSpentVoiceCreditsCommitment: bigint,
): Promise<number[]> => {
  const failedIndices: number[] = [];

  for (let i = 0; i < tallyData.results.tally.length; i += 1) {
    const proof = genTreeProof(
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
      newPerVOSpentVoiceCreditsCommitment,
    );

    if (!isValid) {
      failedIndices.push(i);
    }
  }

  return failedIndices;
};
