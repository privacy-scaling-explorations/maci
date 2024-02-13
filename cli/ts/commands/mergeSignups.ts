import {
  AccQueue__factory as AccQueueFactory,
  MACI__factory as MACIFactory,
  Poll__factory as PollFactory,
} from "maci-contracts";

import {
  DEFAULT_SR_QUEUE_OPS,
  banner,
  contractExists,
  currentBlockTimestamp,
  info,
  logError,
  logGreen,
  logYellow,
  success,
  readContractAddress,
  type MergeSignupsArgs,
} from "../utils";

/**
 * Command to merge the signups of a MACI contract
 * @param MergeSignupsArgs - The arguments for the mergeSignups command
 */
export const mergeSignups = async ({
  pollId,
  maciContractAddress,
  numQueueOps,
  signer,
  quiet = true,
}: MergeSignupsArgs): Promise<void> => {
  banner(quiet);
  const network = await signer.provider?.getNetwork();

  // maci contract validation
  if (!readContractAddress("MACI", network?.name) && !maciContractAddress) {
    logError("Could not read contracts");
  }

  const maciAddress = maciContractAddress || readContractAddress("MACI", network?.name);

  if (!(await contractExists(signer.provider!, maciAddress))) {
    logError("MACI contract does not exist");
  }

  if (pollId < 0) {
    logError("Invalid poll id");
  }

  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollAddress = await maciContract.polls(pollId);

  if (!(await contractExists(signer.provider!, pollAddress))) {
    logError("Poll contract does not exist");
  }

  const pollContract = PollFactory.connect(pollAddress, signer);
  const accQueueContract = AccQueueFactory.connect(await maciContract.stateAq(), signer);

  // check if it's time to merge the message AQ
  const dd = await pollContract.getDeployTimeAndDuration();
  const deadline = Number(dd[0]) + Number(dd[1]);
  const now = await currentBlockTimestamp(signer.provider!);

  if (now < deadline) {
    logError("Voting period is not over");
  }

  let subTreesMerged = false;

  // infinite loop to merge the sub trees
  while (!subTreesMerged) {
    // eslint-disable-next-line no-await-in-loop
    subTreesMerged = await accQueueContract.subTreesMerged();

    if (subTreesMerged) {
      logGreen(quiet, success("All state subtrees have been merged."));
    } else {
      // eslint-disable-next-line no-await-in-loop
      await accQueueContract
        .getSrIndices()
        .then((data) => data.map((x) => Number(x)))
        .then((indices) => {
          logYellow(quiet, info(`Merging state subroots ${indices[0] + 1} / ${indices[1] + 1}`));
        });

      // first merge the subroots
      // eslint-disable-next-line no-await-in-loop
      const tx = await pollContract.mergeMaciStateAqSubRoots(numQueueOps || DEFAULT_SR_QUEUE_OPS, pollId.toString());
      // eslint-disable-next-line no-await-in-loop
      const receipt = await tx.wait();

      if (receipt?.status !== 1) {
        logError("Error merging state subroots");
      }

      logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));
      logGreen(quiet, success(`Executed mergeMaciStateAqSubRoots(); gas used: ${receipt!.gasUsed.toString()}`));
    }
  }

  // check if the state AQ has been fully merged
  const stateTreeDepth = Number(await maciContract.stateTreeDepth());
  const mainRoot = (await accQueueContract.getMainRoot(stateTreeDepth.toString())).toString();

  if (mainRoot === "0" || pollId > 0) {
    // go and merge the state tree
    logYellow(quiet, info("Merging subroots to a main state root..."));
    const tx = await pollContract.mergeMaciStateAq(pollId.toString());
    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("Error merging state subroots");
    }

    logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));
    logGreen(quiet, success(`Executed mergeStateAq(); gas used: ${receipt!.gasUsed.toString()}`));
  } else {
    logYellow(quiet, info("The state tree has already been merged."));
  }
};
