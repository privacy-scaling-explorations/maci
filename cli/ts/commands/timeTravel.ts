import { DEFAULT_ETH_PROVIDER } from "../utils/defaults"
import { Contract, providers } from "ethers"
import { logError, logGreen, success } from "../utils/theme"
import { banner } from "../utils/banner"
import { TimeTravelArgs } from "../utils/interfaces"
import { currentBlockTimestamp, readContractAddress } from "../utils"
import { getDefaultSigner, parseArtifact } from "maci-contracts"

export const timeTravel = async ({
    quiet, 
    provider,
    seconds 
}: TimeTravelArgs) => {
    if(!quiet) banner()
    const signer = await getDefaultSigner()
    try {
        await signer.provider.send('evm_increaseTime', [Number(seconds)])
        await signer.provider.send('evm_mine', [])

        if (!quiet) logGreen(success(`Fast-forwarded ${seconds} seconds`))
    } catch (error: any) {
        logError(error.message)
    }  
}