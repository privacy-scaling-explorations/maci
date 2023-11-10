import { logError, logGreen, success } from "../utils/theme"
import { banner } from "../utils/banner"
import { TimeTravelArgs } from "../utils/interfaces"
import { getDefaultSigner } from "maci-contracts"

/**
 * Utility to travel in time when using a local blockchain
 * @param param0 - the params
 */
export const timeTravel = async ({
    quiet, 
    seconds 
}: TimeTravelArgs) => {
    if(!quiet) banner()
    const signer = await getDefaultSigner()
    try {
        // send the instructions to the provider
        await signer.provider.send('evm_increaseTime', [Number(seconds)])
        await signer.provider.send('evm_mine', [])

        if (!quiet) logGreen(success(`Fast-forwarded ${seconds} seconds`))
    } catch (error: any) {
        logError(error.message)
    }  
}