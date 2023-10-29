import { readFileSync } from "fs"
import { contractAddressesStore } from "../utils/constants"
import { banner } from "../utils/banner"
import { logGreen, info } from "../utils/theme"
import { ShowContractsArgs } from "../utils"

export const showContracts = ({
    quiet
}: ShowContractsArgs) => {
    if(!quiet) banner() 
    const data = JSON.parse(readFileSync(contractAddressesStore, "utf8").toString())

    for (const entry of Object.entries(data)) {
        logGreen(info(`${entry[0]}: ${entry[1]}`))
    }
}