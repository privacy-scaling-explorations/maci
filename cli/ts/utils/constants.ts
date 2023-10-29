import { join } from 'path'
export const contractAddressStoreName = "contractAddresses.json"
export const oldContractAddressStoreName = "contractAddresses.old.json"
export const contractAddressesStore = join(__dirname, '..', '..', contractAddressStoreName)
export const oldContractAddressesStore = join(__dirname, '..', '..', oldContractAddressStoreName)