import { readContractAddress } from "../utils/storage"
import { Contract, constants } from "ethers"
import { contractExists } from "../utils/contracts"
import { getDefaultSigner, parseArtifact } from "maci-contracts"
import { logError, logGreen, success } from "../utils/theme"
import { AirdropArgs } from "../utils/interfaces"
import { banner } from "../utils/banner"

/**
 * Utility that can be used to get 
 * topup credits aidropped
 * to the coordinator
 * @returns 
 */
export const airdrop = async ({
    amount,
    contractAddress,
    pollId,
    maciAddress,
    quiet
}: AirdropArgs) => {
    if(!quiet) banner()
    const topupCredit = readContractAddress("TopupCredit")

    if (!topupCredit && !contractAddress) {
        logError("Please provide an ERC20 contract address")
    }

    const ERC20Address = contractAddress ? contractAddress: topupCredit

    const signer = await getDefaultSigner()
    if (!(await contractExists(signer.provider, ERC20Address))) {
        logError("Invalid ERC20 contract address")
    }

    const tokenAbi = parseArtifact('TopupCredit')[0]

    const tokenContract = new Contract(
        ERC20Address,
        tokenAbi,
        signer
    )

    if (amount < 0) 
        logError("Invalid amount")

    try {
        const tx = await tokenContract.airdrop(
            amount.toString(),
            { gasLimit: 1000000 }
        )
        await tx.wait()

        if (!quiet) logGreen(success(`Airdropped ${amount} credits to ${await signer.getAddress()}`))
    } catch (error: any) {
        logError(error.message)
    }

    if (pollId) {
        maciAddress = readContractAddress("MACI") ? readContractAddress("MACI"): maciAddress
        if (!maciAddress) 
            logError("Please provide a MACI contract address")
        
        const maciAbi = parseArtifact("MACI")[0]

        const maciContract = new Contract(
            maciAddress,
            maciAbi,
            signer
        )

        const pollAddr = await maciContract.getPoll(pollId)
        const MAX_ALLOWANCE = constants.MaxUint256
        try {
            const tx = await tokenContract.approve(
                pollAddr,
                MAX_ALLOWANCE,
                { gasLimit: 1000000 }
            )
            await tx.wait()

            if (!quiet) logGreen(success(`Approved ${pollAddr} to spend ${amount} credits`))
        } catch (error: any) {
            logError(error.message)
        }
    }
}