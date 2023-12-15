import { existsSync, readdirSync, rmSync } from "fs";
import { arch } from "os";

import path from "path";

/**
 * Test utility to clean up the proofs directory
 * and the tally.json file
 */
export const cleanVanilla = () => {
  const files = readdirSync("./proofs");
  for (const file of files) {
    rmSync(path.join("./proofs", file));
  }
  if (existsSync("./tally.json")) rmSync("./tally.json");
};

/**
 * Test utility to clean up the proofs directory
 * adn the subsidy.json file
 */
export const cleanSubsidy = () => {
  cleanVanilla();
  if (existsSync("./subsidy.json")) rmSync("./subsidy.json");
};

/**
 * Check if we are running on an arm chip
 * @returns whether we are running on an arm chip
 */
export const isArm = (): boolean => {
  return arch().includes("arm");
};
