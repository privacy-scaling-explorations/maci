import type { IMergeSignupsArgs } from "./types";
import type { TransactionReceipt } from "ethers";

import { getPollContracts } from "../poll";
import { currentBlockTimestamp } from "../utils/contracts";

/**
 * Command to merge the signups of a MACI contract
 * @param args the arguments for the mergeSignups command
 * @return transaction receipt
 */
export const mergeSignups = async ({ pollId, maciAddress, signer }: IMergeSignupsArgs): Promise<TransactionReceipt> => {
  const { poll: pollContract } = await getPollContracts({ maciAddress, pollId, signer });

  // check if it's time to merge the signups
  const [endDate, now] = await Promise.all([pollContract.endDate(), currentBlockTimestamp(signer.provider!)]);

  if (now < endDate) {
    throw new Error("Voting period is not over");
  }

  const isMerged = await pollContract.stateMerged();

  if (isMerged) {
    throw new Error("The state tree has already been merged");
  }

  const receipt = await pollContract.mergeState().then((tx) => tx.wait());

  if (receipt?.status !== 1) {
    throw new Error("Error merging state subroots");
  }

  return receipt;
};
