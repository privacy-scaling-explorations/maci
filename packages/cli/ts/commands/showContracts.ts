import fs from "fs";

import { banner, contractAddressesStore, logGreen, info, logError } from "../utils";

/**
 * Utility to print all contracts that have been deployed using maci-cli
 * @param quiet - whether to log the output
 */
export const showContracts = (quiet = false): void => {
  banner(quiet);

  if (!fs.existsSync(contractAddressesStore)) {
    logError("No contracts have been deployed yet");
  }

  const data = JSON.parse(fs.readFileSync(contractAddressesStore, "utf8").toString()) as Record<string, string>;

  Object.entries(data).forEach(([key, value]) => {
    logGreen(quiet, info(`${key}: ${value}`));
  });
};
