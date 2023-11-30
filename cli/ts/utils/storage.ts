import { contractAddressesStore } from "./constants"
import { writeFileSync, readFileSync, existsSync } from "fs"
import { logError } from "./theme"

/**
 * Read a JSON file from disk
 * @param path - the path of the file
 * @returns the JSON object
 */
export const readJSONFile = (path: string): object => {
    if (!existsSync(path)) logError(`File ${path} does not exist`)
    return JSON.parse(readFileSync(path).toString())
}

/**
 * Store a contract address to the local address store file
 * @param contractName - the name of the contract
 * @param address - the address of the contract
 */
export const storeContractAddress = (
    contractName: string, 
    address: string
) => {
    // if it does not exist yet, then create it
    if (!existsSync(contractAddressesStore)) writeFileSync(contractAddressesStore, "{}")
    const contractAddrs = readJSONFile(contractAddressesStore)
    contractAddrs[contractName] = address
    writeFileSync(contractAddressesStore, JSON.stringify(contractAddrs, null, 4))
}

/**
 * Read a contract address from the local address store file
 * @param contractName - the name of the contract
 * @returns the contract address or a undefined it it does not exist
 */
export const readContractAddress = (
    contractName: string
): string => {
    const contractAddrs = readJSONFile(contractAddressesStore)
    return contractAddrs[contractName] || ""
}

/**
 * Delete the content of the contract address file file
 */
export const resetContractAddresses = () => {
    writeFileSync(contractAddressesStore, JSON.stringify({}, null, 4))
}

/**
 * Check if an array of paths exist on the local file system
 * @param paths - the array of paths to check
 * @returns an array of boolean and string, 
 * where the boolean indicates whether all paths exist, and the string 
 * is the path that does not exist
 */
export const doesPathExist = (paths: Array<string>): [boolean, string] => {
    for (const path of paths) {
        if (!existsSync(path)) {
            return [false, path]
        }
    }
    return [true, null]
}