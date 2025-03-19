import { id } from "ethers";
import { task, types } from "hardhat/config";

import { execFile } from "child_process";
import fs from "fs";
import path from "path";

// Regular expression to match custom error definitions in Solidity
// It matches lines like: error InvalidPubKey();
// or with parameters: error PollDoesNotExist(uint256 pollId);
const ERROR_REGEX = /error\s+([A-Za-z0-9_]+)\(([^)]*)\)\s*;/g;

function extractErrors(solContent: string): string[] {
  const errors: string[] = [];
  let match = ERROR_REGEX.exec(solContent);

  while (match !== null) {
    // Build the full signature string.
    // Remove extra spaces from parameters.
    const errorName = match[1];
    const params = match[2].trim().replace(/\s+/g, " ");
    const signature = `${errorName}(${params})`;
    errors.push(signature);
    match = ERROR_REGEX.exec(solContent);
  }

  return errors;
}

/**
 * Extracts custom errors from a Solidity file and prints their selectors.
 * Useful for debugging RPC responses containing errors like:
 * {
      "jsonrpc": "2.0",
      "id": 16,
      "error": {
          "code": 3,
          "message": "execution reverted",
          "data": "0xe0f2d7b1"
      }
    }
  * @params solFilePath Path to the Solidity file
  * @params flattenFile Flag to indicate if the file should be flattened before processing
  *         (useful for contracts with imports that define custom errors)
  * Usage: ts-node scripts/decodeErrorsFromSol.ts <path-to-sol-file> <flatten_file_flag>
  * @example 1: pnpm encode-errors --sol-file-path contracts/VerifyingKeysRegistry.sol --flat
  * @example 2: pnpm encode-errors --sol-file-path contracts/MACI.sol
 */
task("encode-errors", "Extracts custom errors from a Solidity file and prints their selectors")
  .addParam("solFilePath", "Path to the Solidity file", undefined, types.string)
  .addFlag("flat", "Flag to indicate if the file should be flattened before processing")
  .setAction(async ({ solFilePath, flat }: { solFilePath: string; flat: boolean }) => {
    if (!solFilePath) {
      throw new Error(
        "No .sol file. Usage: ts-node scripts/decodeErrorsFromSol.ts <path-to-sol-file> <flatten_file_flag>",
      );
    }
    const absolutePath = path.resolve(solFilePath);

    const { promisify } = await import("util");
    const execFilePromisify = promisify(execFile);

    const fileContent = flat
      ? await execFilePromisify("pnpm", ["exec", "hardhat", "flatten", absolutePath]).then(({ stdout }) => stdout)
      : await fs.promises.readFile(absolutePath, "utf8");

    // Extract custom errors from the file
    const errors = extractErrors(fileContent);

    if (errors.length === 0) {
      throw new Error("No custom errors found in the provided file.");
    }

    errors.forEach((signature) => {
      const selector = id(signature).slice(0, 10);
      // eslint-disable-next-line no-console
      console.log(`${selector} => ${signature}`);
    });
  });
