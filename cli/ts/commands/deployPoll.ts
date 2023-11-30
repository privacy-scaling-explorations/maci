import {
    deployMessageProcessor,
    deploySubsidy,
    deployTally,
    getDefaultSigner,
    parseArtifact,
} from "maci-contracts";
import { banner } from "../utils/banner";
import { readContractAddress, storeContractAddress } from "../utils/storage";
import { info, logError, logGreen } from "../utils/theme";
import { contractExists } from "../utils/contracts";
import { PubKey } from "maci-domainobjs";
import { Contract } from "ethers";
import { PollContracts } from "../utils/interfaces";

/**
 * Deploy a new Poll for the set of MACI's contracts already deployed
 * @param pollDuration - the duration of the poll in seconds
 * @param maxMessages - the maximum number of messages that can be submitted
 * @param maxVoteOptions - the maximum number of vote options
 * @param intStateTreeDepth - the depth of the intermediate state tree
 * @param messageTreeSubDepth - the depth of the message tree sublevels
 * @param messageTreeDepth - the depth of the message tree
 * @param voteOptionTreeDepth - the depth of the vote option tree
 * @param coordinatorPubkey - the coordinator's public key
 * @param maciAddress - the MACI contract address
 * @param quiet - whether to log the output to the console
 * @returns the addresses of the deployed contracts
 */
export const deployPoll = async (
    pollDuration: number,
    maxMessages: number,
    maxVoteOptions: number,
    intStateTreeDepth: number,
    messageTreeSubDepth: number,
    messageTreeDepth: number,
    voteOptionTreeDepth: number,
    coordinatorPubkey: string,
    maciAddress?: string,
    quiet = true
): Promise<PollContracts> => {
    banner(quiet);

    const _maciAddress = readContractAddress("MACI");
    if (!_maciAddress && !maciAddress) {
        logError("Please provide a MACI contract address");
    }

    const _maci = maciAddress ? maciAddress : _maciAddress;

    // required arg -> poll duration
    if (pollDuration <= 0) logError("Duration cannot be <= 0");
    // require arg -> max messages
    if (maxMessages <= 0) logError("Max messages cannot be <= 0");
    // required arg -> max vote options
    if (maxVoteOptions <= 0) logError("Max vote options cannot be <= 0");

    // required arg -> int state tree depth
    if (intStateTreeDepth <= 0) logError("Int state tree depth cannot be <= 0");
    // required arg -> message tree sub depth
    if (messageTreeSubDepth <= 0)
        logError("Message tree sub depth cannot be <= 0");
    // required arg -> message tree depth
    if (messageTreeDepth <= 0) logError("Message tree depth cannot be <= 0");
    // required arg -> vote option tree depth
    if (voteOptionTreeDepth <= 0)
        logError("Vote option tree depth cannot be <= 0");

    const signer = await getDefaultSigner();

    // we check that the contract is deployed
    if (!(await contractExists(signer.provider, _maci)))
        logError("MACI contract does not exist");

    const unserializedKey = PubKey.deserialize(coordinatorPubkey)

    // get the poseidon contracts addresses
    const poseidonT3 = readContractAddress("PoseidonT3");
    const poseidonT4 = readContractAddress("PoseidonT4");
    const poseidonT5 = readContractAddress("PoseidonT5");
    const poseidonT6 = readContractAddress("PoseidonT6");

    // get the verifier contract
    const verifierContractAddress = readContractAddress("Verifier");

    // deploy the message processor
    const messageProcessorContract = await deployMessageProcessor(
        verifierContractAddress,
        poseidonT3,
        poseidonT4,
        poseidonT5,
        poseidonT6,
        true
    );

    // deploy the tally contract
    const tallyContract = await deployTally(
        verifierContractAddress,
        poseidonT3,
        poseidonT4,
        poseidonT5,
        poseidonT6,
        true
    );

    // deploy the subsidy contract
    const subsidyContract = await deploySubsidy(
        verifierContractAddress,
        poseidonT3,
        poseidonT4,
        poseidonT5,
        poseidonT6,
        true
    );

    const maciAbi = parseArtifact("MACI")[0];
    const maciContract = new Contract(_maci, maciAbi, signer);

    // deploy the poll
    let pollAddr = "";

    try {
        // deploy the poll contract via the maci contract
        const tx = await maciContract.deployPoll(
            pollDuration,
            { maxMessages, maxVoteOptions },
            {
                intStateTreeDepth,
                messageTreeSubDepth,
                messageTreeDepth,
                voteOptionTreeDepth,
            },
            unserializedKey.asContractParam(),
            { gasLimit: 10000000 }
        );

        const receipt = await tx.wait();
        const iface = maciContract.interface;
        const log = iface.parseLog(receipt.logs[receipt.logs.length - 1]);
        const name = log.name;
        // we are trying to get the poll id from the event logs
        // if we do not find this log then we throw
        if (name !== "DeployPoll") logError("Invalid event log");

        const pollId = log.args._pollId;
        pollAddr = log.args._pollAddr;
         {
            logGreen(quiet, info(`Poll ID: ${pollId.toString()}`));
            logGreen(quiet, info(`Poll contract: ${pollAddr}`));
            logGreen(
                quiet,
                info(
                    `Message processor contract: ${messageProcessorContract.address}`
                )
            );
            logGreen(quiet, info(`Tally contract: ${tallyContract.address}`));
            logGreen(quiet, info(`Subsidy contract: ${subsidyContract.address}`));
        }
        // store the addresss
        storeContractAddress(
            "MessageProcessor-" + pollId.toString(),
            messageProcessorContract.address
        );
        storeContractAddress(
            "Tally-" + pollId.toString(),
            tallyContract.address
        );
        storeContractAddress(
            "Subsidy-" + pollId.toString(),
            subsidyContract.address
        );
        storeContractAddress("Poll-" + pollId.toString(), pollAddr);
    } catch (error: any) {
        logError(error.message);
    }

    // we return all of the addresses
    return {
        messageProcessor: messageProcessorContract.address,
        tally: tallyContract.address,
        subsidy: subsidyContract.address,
        poll: pollAddr,
    };
};
