import {
  MACI__factory as MACIFactory,
  Poll__factory as PollFactory,
  AccQueue__factory as AccQueueFactory,
} from "maci-contracts/typechain-types";

import type { MergeMessagesArgs } from "../utils/interfaces";

import { banner } from "../utils/banner";
import { contractExists, currentBlockTimestamp } from "../utils/contracts";
import { DEFAULT_SR_QUEUE_OPS } from "../utils/defaults";
import { readContractAddress } from "../utils/storage";
import { info, logError, logGreen, logYellow, success } from "../utils/theme";

/**
 * Merge the message queue on chain
 * @param MergeMessagesArgs - The arguments for the mergeMessages command
 */
export const mergeMessages = async ({
  pollId,
  quiet = true,
  maciAddress,
  numQueueOps,
  signer,
}: MergeMessagesArgs): Promise<void> => {
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
  const extContracts = await pollContract.extContracts();
  const messageAqContractAddr = extContracts.messageAq;

  const accQueueContract = AccQueueFactory.connect(messageAqContractAddr, signer);

  // check if it's time to merge the message AQ
  const dd = await pollContract.getDeployTimeAndDuration();
  const deadline = Number(dd[0]) + Number(dd[1]);
  const now = await currentBlockTimestamp(signer.provider!);

  if (now < deadline) {
    logError("The voting period is not over yet");
  }

  let subTreesMerged = false;

  // infinite loop to merge the sub trees
  while (!subTreesMerged) {
    // eslint-disable-next-line no-await-in-loop
    subTreesMerged = await accQueueContract.subTreesMerged();

    if (subTreesMerged) {
      logGreen(quiet, success("All message subtrees have been merged."));
    } else {
      // eslint-disable-next-line no-await-in-loop
      await accQueueContract
        .getSrIndices()
        .then((data) => data.map((x) => Number(x)))
        .then((indices) => {
          logYellow(quiet, info(`Merging message subroots ${indices[0] + 1} / ${indices[1] + 1}`));
        });

      // eslint-disable-next-line no-await-in-loop
      const tx = await pollContract.mergeMessageAqSubRoots(numQueueOps || DEFAULT_SR_QUEUE_OPS);
      // eslint-disable-next-line no-await-in-loop
      const receipt = await tx.wait();

      if (receipt?.status !== 1) {
        logError("Transaction failed");
      }

      logGreen(quiet, success(`Executed mergeMessageAqSubRoots(); gas used: ${receipt!.gasUsed.toString()}`));

      logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));
    }
  }

  // check if the message AQ has been fully merged
  const messageTreeDepth = Number((await pollContract.treeDepths()).messageTreeDepth);

  // check if the main root was not already computed
  const mainRoot = (await accQueueContract.getMainRoot(messageTreeDepth.toString())).toString();
  if (mainRoot === "0") {
    // go and merge the message tree

    logYellow(quiet, info("Merging subroots to a main message root..."));
    const tx = await pollContract.mergeMessageAq();
    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("Transaction failed");
    }

    logGreen(quiet, success(`Executed mergeMessageAq(); gas used: ${receipt!.gasUsed.toString()}`));
    logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));
    logGreen(quiet, success("The message tree has been merged."));
  } else {
    logYellow(quiet, info("The message tree has already been merged."));
  }
};
