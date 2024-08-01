import path from "path";

// local file name where we are storing the contract addresses
export const contractAddressStoreName = "contractAddresses.json";
// local file name where we are storing a previous deployment's contract addresses
export const oldContractAddressStoreName = "contractAddresses.old.json";
// local file path where we are storing the contract addresses
export const contractAddressesStore = path.resolve(__dirname, "..", "..", contractAddressStoreName);
// local file path where we are storing a previous deployment's contract addresses
export const oldContractAddressesStore = path.resolve(__dirname, "..", "..", oldContractAddressStoreName);
