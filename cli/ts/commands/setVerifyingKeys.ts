import { VerifyingKey } from "maci-domainobjs"
import { readContractAddress } from "../utils/storage"
import { info, logError, logYellow } from "../utils/theme"
import { existsSync } from "fs"
import { extractVk } from "maci-circuits"
import { getDefaultSigner, parseArtifact } from "maci-contracts"
import { contractExists } from "../utils/contracts"
import { Contract } from "ethers"
import { genProcessVkSig, genSubsidyVkSig, genTallyVkSig } from "maci-core"
import { compareVks } from "../utils/"
import { banner } from "../utils/banner"

/**
 * Function that sets the verifying keys in the VkRegistry contract
 * @param stateTreeDepth - the depth of the state tree
 * @param intStateTreeDepth - the depth of the state subtree
 * @param messageTreeDepth - the depth of the message tree
 * @param voteOptionTreeDepth - the depth of the vote option tree
 * @param messageBatchDepth - the depth of the message batch tree
 * @param processMessagesZkeyPath - the path to the process messages zkey
 * @param tallyVotesZkeyPath - the path to the tally votes zkey
 * @param vkRegistry - the address of the vkRegistry contract
 * @param subsidyZkeyPath - the path to the subsidy zkey
 * @param quiet - whether to log the output
 */
export const setVerifyingKeys = async (
    stateTreeDepth: number,
    intStateTreeDepth: number, 
    messageTreeDepth: number,
    voteOptionTreeDepth: number,
    messageBatchDepth: number,
    processMessagesZkeyPath: string, 
    tallyVotesZkeyPath: string,
    vkRegistry?: string,
    subsidyZkeyPath?: string,
    quiet?: boolean
) => {
    if(!quiet) banner()
    // we must either have the contract as param or stored to file
    if (!readContractAddress("VkRegistry") && !vkRegistry) {
        logError('vkRegistry contract address is empty') 
    }

    const vkRegistryAddress = vkRegistry ? vkRegistry: readContractAddress("VkRegistry")

    // check if zKey files exist
    if (!existsSync(processMessagesZkeyPath)) logError(`1 ${processMessagesZkeyPath} does not exist.`)
    if (!existsSync(tallyVotesZkeyPath)) logError(`2 ${tallyVotesZkeyPath} does not exist.`)
    if (subsidyZkeyPath && !existsSync(subsidyZkeyPath)) logError(`3 ${subsidyZkeyPath} does not exist.`)

    // extract the vks
    const processVk: VerifyingKey = VerifyingKey.fromObj(await extractVk(processMessagesZkeyPath))
    const tallyVk: VerifyingKey = VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPath))
    
    // validate args 
    if (stateTreeDepth < 1 || intStateTreeDepth < 1 || messageTreeDepth < 1 || voteOptionTreeDepth < 1 || messageBatchDepth < 1) 
        logError('Invalid depth or batch size parameters')

    if (stateTreeDepth < intStateTreeDepth) 
        logError('Invalid state tree depth or intermediate state tree depth')

    // Check the pm zkey filename against specified params
    const pmMatch = processMessagesZkeyPath.match(/.+_(\d+)-(\d+)-(\d+)-(\d+)_/)
    if (!pmMatch) logError(`${processMessagesZkeyPath} has an invalid filename`)
    
    const pmStateTreeDepth = Number(pmMatch[1])
    const pmMsgTreeDepth = Number(pmMatch[2])
    const pmMsgBatchDepth = Number(pmMatch[3])
    const pmVoteOptionTreeDepth = Number(pmMatch[4])

    const tvMatch = tallyVotesZkeyPath.match(/.+_(\d+)-(\d+)-(\d+)_/)
    if (!tvMatch) logError(`${tallyVotesZkeyPath} has an invalid filename`)
    
    const tvStateTreeDepth = Number(tvMatch[1])
    const tvIntStateTreeDepth = Number(tvMatch[2])
    const tvVoteOptionTreeDepth = Number(tvMatch[3])

    if (
        Number(stateTreeDepth) !== pmStateTreeDepth ||
        Number(messageTreeDepth) !== pmMsgTreeDepth ||
        Number(messageBatchDepth) !== pmMsgBatchDepth ||
        Number(voteOptionTreeDepth) !== pmVoteOptionTreeDepth ||
        Number(stateTreeDepth) !== tvStateTreeDepth ||
        Number(intStateTreeDepth) !== tvIntStateTreeDepth ||
        Number(voteOptionTreeDepth) !== tvVoteOptionTreeDepth 
    ) logError('Incorrect .zkey file; please check the circuit params')
    
    // ensure we have a contract deployed at the provided address
    const signer = await getDefaultSigner()
    if (!(await contractExists(signer.provider, vkRegistryAddress))) 
        logError(`A VkRegistry contract is not deployed at ${vkRegistryAddress}`)

    // connect to VkRegistry contract
    const vkRegistryAbi = parseArtifact("VkRegistry")[0]
    const vkRegistryContract = new Contract(
        vkRegistryAddress,
        vkRegistryAbi,
        signer
    )

    const messageBatchSize = 5 ** messageBatchDepth

    // check if the process messages vk was already set
    const processVkSig = genProcessVkSig(
        stateTreeDepth,
        messageTreeDepth,
        voteOptionTreeDepth,
        messageBatchSize,
    )
    if (await vkRegistryContract.isProcessVkSet(processVkSig))
        logError('This process verifying key is already set in the contract')

    // do the same for the tally votes vk
    const tallyVkSig = genTallyVkSig(
        stateTreeDepth,
        intStateTreeDepth,
        voteOptionTreeDepth
    )
    if (await vkRegistryContract.isTallyVkSet(tallyVkSig))
        logError('This tally verifying key is already set in the contract')

    // do the same for the subsidy vk if any 
    if (subsidyZkeyPath) {
        const ssMatch = subsidyZkeyPath.match(/.+_(\d+)-(\d+)-(\d+)_/)
        if (!ssMatch) logError(`${subsidyZkeyPath} has an invalid filename`)
        
        const ssStateTreeDepth = Number(ssMatch[1])
        const ssIntStateTreeDepth = Number(ssMatch[2])
        const ssVoteOptionTreeDepth = Number(ssMatch[3])
        if (
            stateTreeDepth !== ssStateTreeDepth ||
            intStateTreeDepth !== ssIntStateTreeDepth ||
            voteOptionTreeDepth !== ssVoteOptionTreeDepth
        ) logError('Incorrect .zkey file; please check the circuit params')
        
        const subsidyVkSig = genSubsidyVkSig(
            stateTreeDepth,
            intStateTreeDepth,
            voteOptionTreeDepth
        )
        if (await vkRegistryContract.isSubsidyVkSet(subsidyVkSig))
            logError('This subsidy verifying key is already set in the contract')
    }

    // actually set those values
    try {
        if (!quiet) logYellow(info('Setting verifying keys...'))
        // set them onchain
        const tx = await vkRegistryContract.setVerifyingKeys(
            stateTreeDepth,
            intStateTreeDepth,
            messageTreeDepth,
            voteOptionTreeDepth,
            messageBatchSize,
            processVk.asContractParam(),
            tallyVk.asContractParam()
        )

        const receipt = await tx.wait()
        if (receipt.status !== 1) logError('Set verifying keys transaction failed')

        if (!quiet) logYellow(info(`Transaction hash: ${tx.hash}`))

        // confirm that they were actually set correctly 
        const processVkOnChain = await vkRegistryContract.getProcessVk(
            stateTreeDepth,
            messageTreeDepth,
            voteOptionTreeDepth,
            messageBatchSize,
        )

        const tallyVkOnChain = await vkRegistryContract.getTallyVk(
            stateTreeDepth,
            intStateTreeDepth,
            voteOptionTreeDepth,
        )

        if (!compareVks(processVk, processVkOnChain)) logError('processVk mismatch')
        if (!compareVks(tallyVk, tallyVkOnChain)) logError('tallyVk mismatch')

        // set subsidy keys if any
        if (subsidyZkeyPath) {
            const subsidyVk: VerifyingKey = VerifyingKey.fromObj(await extractVk(subsidyZkeyPath))

            const tx = await vkRegistryContract.setSubsidyKeys(
                stateTreeDepth,
                intStateTreeDepth,
                voteOptionTreeDepth,
                subsidyVk.asContractParam()
            )
    
            const receipt = await tx.wait()
            if (receipt.status !== 1) logError('Set subsidy keys transaction failed')
    
            if (!quiet) logYellow(info(`Transaction hash: ${tx.hash}`))

            const subsidyVkOnChain = await vkRegistryContract.getSubsidyVk(
                stateTreeDepth,
                intStateTreeDepth,
                voteOptionTreeDepth,
            )
            if (!compareVks(subsidyVk, subsidyVkOnChain)) 
                logError('subsidyVk mismatch')
        }
    } catch (error: any) {
        logError(error.message)
    }
}