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
} from "../utils/";

/**
 * Command to merge the signups of a MACI contract
 * @param pollId - the id of the poll
 * @param maciContractAddress - the address of the MACI contract
 * @param numQueueOps - the number of queue operations to perform
 * @param quiet - whether to log the output
 */
export const mergeSignups = async (
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

    const accQueueContract = new Contract(
        await maciContract.stateAq(),
        accQueueContractAbi,
        signer
    );

    // check if it's time to merge the message AQ
    const dd = await pollContract.getDeployTimeAndDuration();
    const deadline = Number(dd[0]) + Number(dd[1]);
    const now = await currentBlockTimestamp(signer.provider);
    if (now < deadline) logError("Voting period is not over");

    // infinite loop to merge the sub trees
    while (true) {
        const subTreesMerged = await accQueueContract.subTreesMerged();
        if (subTreesMerged) {
            if (!quiet)
                logGreen(success("All state subtrees have been merged."));
            break;
        }

        const indices = (await accQueueContract.getSrIndices()).map((x: any) =>
            Number(x)
        );

        if (!quiet)
            logYellow(
                info(
                    `Merging state subroots ${indices[0] + 1} / ${
                        indices[1] + 1
                    }`
                )
            );

        // first merge the subroots
        const tx = await pollContract.mergeMaciStateAqSubRoots(
            numQueueOps ? numQueueOps : DEFAULT_SR_QUEUE_OPS,
            pollId.toString()
        );
        const receipt = await tx.wait();
        if (receipt.status !== 1) logError("Error merging state subroots");

        if (!quiet) {
            logYellow(info(`Transaction hash: ${receipt.transactionHash}`));
            logGreen(
                success(
                    `Executed mergeMaciStateAqSubRoots(); gas used: ${receipt.gasUsed.toString()}`
                )
            );
        }
    }

    // check if the state AQ has been fully merged
    const stateTreeDepth = Number(await maciContract.stateTreeDepth());
    const mainRoot = (
        await accQueueContract.getMainRoot(stateTreeDepth.toString())
    ).toString();

    if (mainRoot === "0" || pollId > 0) {
        // go and merge the state tree
        if (!quiet) logYellow(info("Merging subroots to a main state root..."));
        const tx = await pollContract.mergeMaciStateAq(pollId.toString());
        const receipt = await tx.wait();
        if (receipt.status !== 1) logError("Error merging state subroots");

        if (!quiet) {
            logYellow(info(`Transaction hash: ${receipt.transactionHash}`));
            logGreen(
                success(
                    `Executed mergeStateAq(); gas used: ${receipt.gasUsed.toString()}`
                )
            );
        }
    } else {
        if (!quiet) logYellow(info("The state tree has already been merged."));
    }
};
