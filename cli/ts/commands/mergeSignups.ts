import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "maci-contracts/typechain-types";

import type { MergeSignupsArgs } from "../utils/interfaces";

import { banner } from "../utils/banner";
import { contractExists, currentBlockTimestamp } from "../utils/contracts";
import { readContractAddress } from "../utils/storage";
import { info, logError, logGreen, logYellow, success } from "../utils/theme";

/**
 * Command to merge the signups of a MACI contract
 * @param MergeSignupsArgs - The arguments for the mergeSignups command
 */
export const mergeSignups = async ({ pollId, maciAddress, signer, quiet = true }: MergeSignupsArgs): Promise<void> => {
  banner(quiet);
  const network = await signer.provider?.getNetwork();

  // maci contract validation
  const maciContractAddress = maciAddress || (await readContractAddress("MACI", network?.name));

  if (!maciContractAddress) {
    logError("Could not read contracts");
  }

  if (!(await contractExists(signer.provider!, maciContractAddress))) {
    logError("MACI contract does not exist");
  }

  if (pollId < 0) {
    logError("Invalid poll id");
  }

  const maciContract = MACIFactory.connect(maciContractAddress, signer);
  const pollContracts = await maciContract.polls(pollId);

  if (!(await contractExists(signer.provider!, pollContracts.poll))) {
    logError("Poll contract does not exist");
  }

  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  // check if it's time to merge the message AQ
  const dd = await pollContract.getDeployTimeAndDuration();
  const deadline = Number(dd[0]) + Number(dd[1]);
  const now = await currentBlockTimestamp(signer.provider!);

  if (now < deadline) {
    logError("Voting period is not over");
  }

  if (!(await pollContract.stateMerged())) {
    // go and merge the state tree
    logYellow(quiet, info("Calculating root and storing on Poll..."));
    const tx = await pollContract.mergeMaciState();
    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("Error merging state subroots");
    }

    logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));
    logGreen(quiet, success(`Executed mergeStateAq(); gas used: ${receipt!.gasUsed.toString()}`));
  } else {
    logError("The state tree has already been merged.");
  }
};
