import { getDefaultSigner, parseArtifact } from "maci-contracts";
import { CheckVerifyingKeysArgs, banner, compareVks, contractExists, info, logError, logGreen, logYellow, readContractAddress, success } from "../utils/";
import { VerifyingKey } from "maci-domainobjs";
import { extractVk } from "maci-circuits";
import { existsSync } from "fs";
import { Contract } from "ethers";

/**
 * Command to confirm that the verifying keys in the contract match the
 * local ones
 * @param param0 - an object containing the command line arguments
 * @returns whether the verifying keys match or not
 */
export const checkVerifyingKeys = async ({
    quiet,
    maciContract,
    stateTreeDepth,
    intStateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    messageBatchDepth,
    processMessagesZkeyPath,
    tallyVotesZkeyPath,
}: CheckVerifyingKeysArgs): Promise<boolean> => {
    if (!quiet) banner()
    // get the signer
    const signer = await getDefaultSigner()

    // ensure we have the contract addresses that we need
    if (!readContractAddress("MACI") && !maciContract) logError("Please provide a MACI contract address")
    const maciAddress = maciContract ? maciContract : readContractAddress("MACI")
    if (!(await contractExists(signer.provider, maciAddress))) logError("MACI contract does not exist")
    
    const maciContractInstance = new Contract(maciAddress, await parseArtifact("MACI")[0], signer) 

    // we need to ensure that the zkey files exist
    if (!existsSync(processMessagesZkeyPath)) logError("Process messages zkey does not exist")
    if (!existsSync(tallyVotesZkeyPath)) logError("Tally votes zkey does not exist")

    // extract the verification keys from the zkey files
    const processVk: VerifyingKey = VerifyingKey.fromObj(await extractVk(processMessagesZkeyPath))
    const tallyVk: VerifyingKey = VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPath))

    try {
        if (!quiet) logYellow(info("Retrieving verifying keys from the contract..."))
        const vkRegistryAddress = await maciContractInstance.vkRegistry()
        const vkRegistryContract = new Contract(
            vkRegistryAddress,
            await parseArtifact("VkRegistry")[0],
            signer
        )

        const messageBatchSize = 5 ** messageBatchDepth

        const processVkOnChain = await vkRegistryContract.getProcessVk(
            stateTreeDepth,
            messageTreeDepth,
            voteOptionTreeDepth,
            messageBatchSize
        )

        const tallyVkOnChain = await vkRegistryContract.getTallyVk(
            stateTreeDepth,
            intStateTreeDepth,
            voteOptionTreeDepth
        )

        if (!compareVks(processVk, processVkOnChain)) logError("Process verifying keys do not match")
        if (!compareVks(tallyVk, tallyVkOnChain)) logError("Tally verifying keys do not match")
    } catch (error: any) { logError(error.message) }

    if (!quiet) logGreen(success("Verifying keys match"))

    return true 
}