import { readFileSync } from "fs"
import { contractAddressesStore } from "../utils/constants"
import { banner } from "../utils/banner"
import { logGreen, info } from "../utils/theme"
import { ShowContractsArgs } from "../utils"

/**
 * Utility to print all contracts that have been deployed using maci-cli
 * @param param0 - the params to this function
 */
export const showContracts = ({
    quiet
}: ShowContractsArgs) => {
    if(!quiet) banner() 
    const data = JSON.parse(readFileSync(contractAddressesStore, "utf8").toString())

    for (const entry of Object.entries(data)) {
        logGreen(info(`${entry[0]}: ${entry[1]}`))
    }
}