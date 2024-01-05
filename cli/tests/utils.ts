import fs from "fs";
import os from "os";
import path from "path";

/**
 * Test utility to clean up the proofs directory
 * and the tally.json file
 */
export const cleanVanilla = (): void => {
  const files = fs.readdirSync("./proofs");

  files.forEach((file) => {
    fs.rmSync(path.resolve("./proofs", file));
  });

  if (fs.existsSync("./tally.json")) {
    fs.rmSync("./tally.json");
  }
};

/**
 * Test utility to clean up the proofs directory
 * adn the subsidy.json file
 */
export const cleanSubsidy = (): void => {
  cleanVanilla();

  if (fs.existsSync("./subsidy.json")) {
    fs.rmSync("./subsidy.json");
  }
};

/**
 * Check if we are running on an arm chip
 * @returns whether we are running on an arm chip
 */
export const isArm = (): boolean => os.arch().includes("arm");
