import { DEFAULT_ETH_PROVIDER } from "../utils/defaults"
import { providers } from "ethers"
import { logError, logGreen, success } from "../utils/theme"
import { banner } from "../utils/banner"
import { TimeTravelArgs } from "../utils/interfaces"

export const timeTravel = async ({
    quiet, 
    provider,
    seconds 
}: TimeTravelArgs) => {
    if(!quiet) banner()
    const ethProvider = provider ? provider : DEFAULT_ETH_PROVIDER
    const rpcProvider = new providers.JsonRpcProvider(ethProvider)

    try {
        const blockBefore = await rpcProvider.getBlock('latest')

        await rpcProvider.send('evm_increaseTime', [Number(seconds)])
        await rpcProvider.send('evm_mine', [])
    
        const blockAfter = await rpcProvider.getBlock('latest')
        const timeIncreased = blockAfter.timestamp - blockBefore.timestamp === Number(seconds)

        console.log("INCREASED", timeIncreased)
        if (!quiet) logGreen(success(`Fast-forwarded ${seconds} seconds`))
    } catch (error: any) {
        logError(error.message)
    }  
}