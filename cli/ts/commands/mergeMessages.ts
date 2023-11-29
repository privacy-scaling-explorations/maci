import { getDefaultSigner, parseArtifact } from "maci-contracts";
import { Contract } from "ethers";
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
    quiet = true
) => {
    if (!quiet) banner();
    const signer = await getDefaultSigner();

    // maci contract validation
    if (!readContractAddress("MACI") && !maciContractAddress)
        logError("Could not read contracts");
    const maciAddress = maciContractAddress
        ? maciContractAddress
        : readContractAddress("MACI");
    if (!(await contractExists(signer.provider, maciAddress)))
        logError("MACI contract does not exist");

    if (pollId < 0) logError("Invalid poll id");

    const maciContractAbi = parseArtifact("MACI")[0];
    const pollContractAbi = parseArtifact("Poll")[0];
    const accQueueContractAbi = parseArtifact("AccQueue")[0];

    const maciContract = new Contract(maciAddress, maciContractAbi, signer);

    const pollAddress = await maciContract.polls(pollId);
    if (!(await contractExists(signer.provider, pollAddress)))
        logError("Poll contract does not exist");

    const pollContract = new Contract(pollAddress, pollContractAbi, signer);
    const extContracts = await pollContract.extContracts();
    const messageAqContractAddr = extContracts.messageAq;

    const accQueueContract = new Contract(
        messageAqContractAddr,
        accQueueContractAbi,
        signer
    );

    // we need to ensure that the signer is the owner of the poll contract
    // this is because only the owner can merge the message AQ
    const pollOwner = await pollContract.owner();
    if (pollOwner.toLowerCase() !== signer.address.toLowerCase())
        logError("The signer is not the owner of this Poll contract");

    // check if it's time to merge the message AQ
    const dd = await pollContract.getDeployTimeAndDuration();
    const deadline = Number(dd[0]) + Number(dd[1]);
    const now = await currentBlockTimestamp(signer.provider);

    if (now < deadline) logError("The voting period is not over yet");

    // infinite loop to merge the sub trees
    while (true) {
        if (await accQueueContract.subTreesMerged()) {
            if (!quiet)
                logGreen(success("All message subtrees have been merged."));
            break;
        }

        const indices = (await accQueueContract.getSrIndices()).map((x: any) =>
            Number(x)
        );

        if (!quiet)
            logYellow(
                info(
                    `Merging message subroots ${indices[0] + 1} / ${
                        indices[1] + 1
                    }`
                )
            );

        const tx = await pollContract.mergeMessageAqSubRoots(
            numQueueOps ? numQueueOps : DEFAULT_SR_QUEUE_OPS
        );
        const receipt = await tx.wait();
        if (receipt.status !== 1) logError("Transaction failed");

        if (!quiet)
            logGreen(
                success(
                    `Executed mergeMessageAqSubRoots(); gas used: ${receipt.gasUsed.toString()}`
                )
            );
        if (!quiet)
            logYellow(info(`Transaction hash: ${receipt.transactionHash}`));
    }

    // check if the message AQ has been fully merged
    const messageTreeDepth = Number(
        (await pollContract.treeDepths()).messageTreeDepth
    );

    // check if the main root was not already computed
    const mainRoot = (
        await accQueueContract.getMainRoot(messageTreeDepth.toString())
    ).toString();
    if (mainRoot === "0") {
        // go and merge the message tree
        if (!quiet)
            logYellow(info("Merging subroots to a main message root..."));
        const tx = await pollContract.mergeMessageAq();
        const receipt = await tx.wait();
        if (receipt.status !== 1) logError("Transaction failed");

        if (!quiet) {
            logGreen(
                success(
                    `Executed mergeMessageAq(); gas used: ${receipt.gasUsed.toString()}`
                )
            );
            logYellow(info(`Transaction hash: ${receipt.transactionHash}`));
            logGreen(success("The message tree has been merged."));
        }
    } else {
        logYellow(info("The message tree has already been merged."));
    }
};
