import { type CircomkitConfig, type CircuitConfig, Circomkit } from "circomkit";

import fs from "fs";
import path from "path";

import type { CircuitConfigWithName } from "./types";

import { cleanThreads } from "./utils";

/**
 * Generate the zkeys for MACI's circuits using circomkit
 * @dev This should only be used for testing purposes, or to generate the genesis zkey
 * for a new trusted setup ceremony. Never use zkeys that have not undergone a ceremony
 * in production.
 * @param outPath - the path to the output folder
 */
export const generateZkeys = async (outputPath?: string): Promise<void> => {
  // read circomkit config files
  const configFilePath = path.resolve(__dirname, "..", "circomkit.json");
  const circomKitConfig = JSON.parse(fs.readFileSync(configFilePath, "utf-8")) as CircomkitConfig;
  const circuitsConfigPath = path.resolve(__dirname, "..", "circom", "circuits.json");
  const circuitsConfigContent = JSON.parse(fs.readFileSync(circuitsConfigPath, "utf-8")) as unknown as Record<
    string,
    CircuitConfig
  >;
  const circuitsConfigs: CircuitConfigWithName[] = Object.entries(circuitsConfigContent).map(([name, config]) => ({
    name,
    ...config,
  }));

  const outPath = outputPath ? path.resolve(outputPath) : undefined;
  // update the output directory
  if (outPath) {
    circomKitConfig.dirBuild = outPath;
    circomKitConfig.dirPtau = outPath;
  }

  const circomkitInstance = new Circomkit({
    ...circomKitConfig,
    verbose: false,
  });

  // loop through each circuit config and compile them
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < circuitsConfigs.length; i += 1) {
    const circuit = circuitsConfigs[i];

    // eslint-disable-next-line no-console
    console.log(`Generating zKey for ${circuit.name}...`);

    // eslint-disable-next-line no-await-in-loop
    const { proverKeyPath } = await circomkitInstance.setup(circuit.name);
    // rename the zkey
    const zkeyPath = path.resolve(circomKitConfig.dirBuild, circuit.name, `${circuit.name}.0.zkey`);
    fs.renameSync(proverKeyPath, zkeyPath);
  }

  // clean up the threads so we can exit
  await cleanThreads();
};

if (require.main === module) {
  (async () => {
    const outputPathIndex = process.argv.indexOf("--outPath");
    if (outputPathIndex === -1) {
      await generateZkeys();
    } else {
      const outputFolder = process.argv[process.argv.indexOf("--outPath") + 1];
      await generateZkeys(outputFolder);
    }
  })();
}
