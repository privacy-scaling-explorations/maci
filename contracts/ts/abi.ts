import fs from "fs";
import path from "path";

import type { Fragment, JsonFragment } from "ethers";

import { abiDir } from "./constants";

// a type representing the ABI of a contract
export type TAbi = string | readonly (string | Fragment | JsonFragment)[];

/**
 * Parse a contract artifact and return its ABI and bytecode.
 * @param filename - the name of the contract
 * @returns the ABI and bytecode of the contract
 */
export const parseArtifact = (filename: string): [TAbi, string] => {
  let filePath = "contracts/";
  if (filename.includes("Gatekeeper")) {
    filePath += "gatekeepers/";
    filePath += `${filename}.sol`;
  }

  if (filename.includes("VoiceCredit")) {
    filePath += "initialVoiceCreditProxy/";
    filePath += `${filename}.sol`;
  }

  if (filename.includes("Verifier")) {
    filePath += "crypto/Verifier.sol/";
  }

  if (filename.includes("AccQueue")) {
    filePath += `trees/${filename}.sol/`;
  }

  if (filename.includes("Poll") || filename.includes("MessageAq")) {
    filePath += "Poll.sol";
  }

  if (!filePath.includes(".sol")) {
    filePath += `${filename}.sol`;
  }

  const contractArtifact = JSON.parse(
    fs.readFileSync(path.resolve(abiDir, filePath, `${filename}.json`)).toString(),
  ) as {
    abi: TAbi;
    bytecode: string;
  };

  return [contractArtifact.abi, contractArtifact.bytecode];
};
