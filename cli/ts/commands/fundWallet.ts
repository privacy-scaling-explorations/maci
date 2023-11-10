import { getDefaultSigner } from "maci-contracts"
import { 
    FundWalletArgs,
    info, 
    logError, 
    logYellow, 
    logGreen, 
    success, 
    banner
} from "../utils/"

/**
 * Fund a new wallet with Ether
 * @param params - The fund wallet arguments
 */
export const fundWallet = async ({
    quiet,
    amount,
    address
}: FundWalletArgs) => {
    if(!quiet) banner()
    const signer = await getDefaultSigner()
    
    // fund the wallet by sending Ether to it
    try {
        const tx = await signer.sendTransaction({ to: address, value: amount.toString() })
        const receipt = await tx.wait()
        if (receipt.status != 1) logError("Transaction failed")

        if (!quiet) {
            logYellow(info(`Transaction hash: ${tx.hash}`))
            logGreen(success(`Successfully funded ${address} with ${amount} wei`))
        }
    } catch (error: any) { logError(error.message) }
}

