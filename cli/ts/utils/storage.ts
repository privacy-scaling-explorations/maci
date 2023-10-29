import { contractAddressesStore } from "./constants"
import { writeFileSync, readFileSync, existsSync } from "fs"

/**
 * 
 * @param path 
 * @returns 
 */
export const readJSONFile = (path: string): object => {
    return JSON.parse(readFileSync(path).toString())
}

/**
 * 
 * @param contractName 
 * @param address 
 */
export const storeContractAddress = (
    contractName: string, 
    address: string
) => {
    const contractAddrs = readJSONFile(contractAddressesStore)
    contractAddrs[contractName] = address
    writeFileSync(contractAddressesStore, JSON.stringify(contractAddrs, null, 4))
}

/**
 * 
 * @param contractName 
 * @returns 
 */
export const readContractAddress = (
    contractName: string
): string | undefined => {
    const contractAddrs = readJSONFile(contractAddressesStore)
    return contractAddrs[contractName]
}

/**
 * Delete the content of the file
 */
export const resetContractAddresses = () => {
    writeFileSync(contractAddressesStore, JSON.stringify({}, null, 4))
}

/**
 * Check if an array of paths exist on the local file system
 * @param paths the array of paths to check
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