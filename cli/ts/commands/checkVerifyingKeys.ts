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
}: CheckVerifyingKeysArgs) => {
    if (!quiet) banner()
    const signer = await getDefaultSigner()

    if (!readContractAddress("MACI") && !maciContract) logError("Please provide a MACI contract address")
    const maciAddress = maciContract ? maciContract : readContractAddress("MACI")

    if (!existsSync(processMessagesZkeyPath)) logError("Process messages zkey does not exist")
    if (!existsSync(tallyVotesZkeyPath)) logError("Tally votes zkey does not exist")

    const processVk: VerifyingKey = VerifyingKey.fromObj(await extractVk(processMessagesZkeyPath))
    const tallyVk: VerifyingKey = VerifyingKey.fromObj(await extractVk(tallyVotesZkeyPath))

    if (!(await contractExists(signer.provider, maciAddress))) logError("MACI contract does not exist")

    const maciContractInstance = new Contract(maciAddress, await parseArtifact("MACI")[0], signer) 

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
}