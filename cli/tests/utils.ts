import { existsSync, readdirSync, rmSync } from "fs";
import { join } from "path";

/**
 * Test utility to clean up the proofs directory
 * and the tally.json file
 */
export const cleanVanilla = () => {
    const files = readdirSync("./proofs");
    for (const file of files) {
        rmSync(join("./proofs", file));
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
