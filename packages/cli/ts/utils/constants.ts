import { EMode } from "@maci-protocol/sdk";

import path from "path";

// local file path where we are storing the contract addresses
export const contractAddressesStorePath = path.resolve(__dirname, "..", "..", "deployed-contracts.json");

export const MODE_NAME_TO_ENUM: Record<string, EMode> = {
  qv: EMode.QV,
  "non-qv": EMode.NON_QV,
  full: EMode.FULL,
};
