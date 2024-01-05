import { BaseContract } from "ethers";
import { MACI, Poll, AccQueue, getDefaultSigner, parseArtifact } from "maci-contracts";

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
} from "../utils";

/**
 * Merge the message queue on chain
 * @param pollId - the id of the poll
 * @param quiet - whether to log the output
 * @param maciContractAddress - the address of the MACI contract
 * @param numQueueOps - the number of queue operations to merge
 */
export const mergeMessages = async (
  pollId: number,
  maciContractAddress?: string,
  numQueueOps?: string,
  quiet = true,
): Promise<void> => {
  banner(quiet);
  const signer = await getDefaultSigner();

  // maci contract validation
  if (!readContractAddress("MACI") && !maciContractAddress) {
    logError("Could not read contracts");
  }
  const maciAddress = maciContractAddress || readContractAddress("MACI");
  if (!(await contractExists(signer.provider!, maciAddress))) {
    logError("MACI contract does not exist");
  }

  if (pollId < 0) {
    logError("Invalid poll id");
  }

  const maciContractAbi = parseArtifact("MACI")[0];
  const pollContractAbi = parseArtifact("Poll")[0];
  const accQueueContractAbi = parseArtifact("AccQueue")[0];

  const maciContract = new BaseContract(maciAddress, maciContractAbi, signer) as MACI;

  const pollAddress = await maciContract.polls(pollId);
  if (!(await contractExists(signer.provider!, pollAddress))) {
    logError("Poll contract does not exist");
  }

  const pollContract = new BaseContract(pollAddress, pollContractAbi, signer) as Poll;
  const extContracts = await pollContract.extContracts();
  const messageAqContractAddr = extContracts.messageAq;

  const accQueueContract = new BaseContract(messageAqContractAddr, accQueueContractAbi, signer) as AccQueue;

  // we need to ensure that the signer is the owner of the poll contract
  // this is because only the owner can merge the message AQ
  const pollOwner = await pollContract.owner();
  const signerAddress = await signer.getAddress();
  if (pollOwner.toLowerCase() !== signerAddress.toLowerCase()) {
    logError("The signer is not the owner of this Poll contract");
  }

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
