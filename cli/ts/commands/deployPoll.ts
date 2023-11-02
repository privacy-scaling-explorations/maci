import { deployMessageProcessor, deploySubsidy, deployTally, deployVerifier, getDefaultSigner, parseArtifact } from "maci-contracts"
import { banner } from "../utils/banner"
import { readContractAddress, storeContractAddress } from "../utils/storage"
import { info, logError, logGreen } from "../utils/theme"
import { contractExists } from "../utils/contracts"
import { PubKey } from "maci-domainobjs"
import { Contract } from "ethers"
import { DeployPollArgs, PollContracts } from "../utils/interfaces"

export const deployPoll = async ({
    maciAddress,
    pollDuration,
    maxMessages,
    maxVoteOptions,
    intStateTreeDepth,
    messageTreeSubDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    coordinatorPubkey,
    quiet 
}: DeployPollArgs): Promise<PollContracts> => {
    if(!quiet) banner()

    let _maciAddress = readContractAddress("MACI")
    if (!_maciAddress && !maciAddress) {
        logError("Please provide a MACI contract address")
    }

    const _maci = maciAddress ? maciAddress: _maciAddress

    // required arg -> poll duration 
    if (pollDuration <= 0) logError("Duration cannot be <= 0")
    // require arg -> max messages
    if (maxMessages <= 0) logError("Max messages cannot be <= 0")
    // required arg -> max vote options
    if (maxVoteOptions <= 0) logError("Max vote options cannot be <= 0")
    
    // required arg -> int state tree depth
    if (intStateTreeDepth <= 0) logError("Int state tree depth cannot be <= 0")
    // required arg -> message tree sub depth
    if (messageTreeSubDepth <= 0) logError("Message tree sub depth cannot be <= 0")
    // required arg -> message tree depth
    if (messageTreeDepth <= 0) logError("Message tree depth cannot be <= 0")
    // required arg -> vote option tree depth
    if (voteOptionTreeDepth <= 0) logError("Vote option tree depth cannot be <= 0")

    const signer = await getDefaultSigner()

    // we check that the contract is deployed
    if (!(await contractExists(signer.provider, _maci))) logError("MACI contract does not exist")
    
    // we check that the coordinator's public key is valid
    if (!PubKey.isValidSerializedPubKey(coordinatorPubkey)) logError("Invalid MACI public key")

    const unserializedKey = PubKey.unserialize(coordinatorPubkey)

    // get the poseidon contracts addresses
    const poseidonT3 = readContractAddress("PoseidonT3")
    const poseidonT4 = readContractAddress("PoseidonT4")
    const poseidonT5 = readContractAddress("PoseidonT5")
    const poseidonT6 = readContractAddress("PoseidonT6")

    // depoy the verifier contract
    const verifierContract = await deployVerifier(true)
    await verifierContract.deployTransaction.wait()

    // deploy the message processor
    const messageProcessorContract = await deployMessageProcessor(
        verifierContract.address, 
        poseidonT3,
        poseidonT4,
        poseidonT5,
        poseidonT6,
        true 
    )
    await messageProcessorContract.deployTransaction.wait()

    // deploy the tally contract
    const tallyContract = await deployTally(verifierContract.address, poseidonT3, poseidonT4, poseidonT5, poseidonT6, true)
    await tallyContract.deployTransaction.wait()

    // deploy the subsidy contract
    const subsidyContract = await deploySubsidy(verifierContract.address, poseidonT3, poseidonT4, poseidonT5, poseidonT6, true)
    await subsidyContract.deployTransaction.wait()

    const maciAbi = parseArtifact("MACI")[0]
    const maciContract = new Contract(
        _maci,
        maciAbi,
        signer
    )

    // deploy the poll
    let pollAddr: string = ""
    try {
        const tx = await maciContract.deployPoll(
            pollDuration,
            { maxMessages, maxVoteOptions },
            {
                intStateTreeDepth,
                messageTreeSubDepth,
                messageTreeDepth,
                voteOptionTreeDepth
            },
            unserializedKey.asContractParam(),
            { gasLimit: 10000000 }
        )

        const receipt = await tx.wait()
        const iface = maciContract.interface
        const log = iface.parseLog(receipt.logs[receipt.logs.length - 1])
        const name = log.name
        if (name !== "DeployPoll") logError("Invalid event log")

        const pollId = log.args._pollId
        pollAddr = log.args._pollAddr
        if (!quiet) {
            logGreen(info(`Poll ID: ${pollId.toString()}`))
            logGreen(info(`Poll contract: ${pollAddr}`))
            logGreen(info(`Message processor contract: ${messageProcessorContract.address}`))
            logGreen(info(`Tally contract: ${tallyContract.address}`))
            logGreen(info(`Subsidy contract: ${subsidyContract.address}`))
        }
        // store the addresss 
        storeContractAddress("MessageProcessor-" + pollId.toString(), messageProcessorContract.address)
        storeContractAddress("Tally-" + pollId.toString(), tallyContract.address)
        storeContractAddress("Subsidy-" + pollId.toString(), subsidyContract.address)
        storeContractAddress("Poll-" + pollId.toString(), pollAddr)
    } catch (error: any) {
        logError(error.message)
    }

    return {
        messageProcessor: messageProcessorContract.address,
        tally: tallyContract.address,
        subsidy: subsidyContract.address,
        poll: pollAddr
    }
}