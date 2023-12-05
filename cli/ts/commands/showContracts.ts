import { existsSync, readFileSync } from "fs";
import { contractAddressesStore } from "../utils/constants";
import { banner } from "../utils/banner";
import { logGreen, info, logError } from "../utils/theme";

/**
 * Utility to print all contracts that have been deployed using maci-cli
 * @param quiet - whether to log the output
 */
export const showContracts = (quiet?: boolean) => {
  banner(quiet);

  if (!existsSync(contractAddressesStore)) logError("No contracts have been deployed yet");

  const data = JSON.parse(readFileSync(contractAddressesStore, "utf8").toString());

  for (const entry of Object.entries(data)) {
    logGreen(quiet, info(`${entry[0]}: ${entry[1]}`));
  }
};
