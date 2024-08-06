import fs from "fs";
import os from "os";
import path from "path";

/**
 * Test utility to clean up the proofs directory
 * and the tally.json file
 */
export const clean = async (): Promise<void> => {
  const files = await fs.promises.readdir("./proofs");

  await Promise.all(files.map((file) => fs.promises.rm(path.resolve("./proofs", file))));

  if (fs.existsSync("./tally.json")) {
    await fs.promises.rm("./tally.json");
  }
};

/**
 * Check if we are running on an arm chip
 * @returns whether we are running on an arm chip
 */
export const isArm = (): boolean => os.arch().includes("arm");
