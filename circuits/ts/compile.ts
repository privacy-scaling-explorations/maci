import { type CircomkitConfig, type CircuitConfig, Circomkit } from "circomkit";

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

import type { CircuitConfigWithName } from "./types";

/**
 * Compile MACI's circuits using circomkit
 * and setup the dir structure
 * @param cWitness - whether to compile to the c witness generator
 * or not
 * @param outputPath - the path to the output folder
 * @returns the build directory
 */
export const compileCircuits = async (cWitness?: boolean, outputPath?: string): Promise<string> => {
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

  // generate the absolute path to the output folder
  const outputPathUpdated = outputPath ? path.resolve(outputPath) : undefined;
  // set the config based on whether to compile the c witness or no
  if (cWitness) {
    circomKitConfig.cWitness = true;
  } else {
    circomKitConfig.cWitness = false;
  }

  // update the build directory if we have an output path
  if (outputPathUpdated) {
    circomKitConfig.dirBuild = outputPathUpdated;
    circomKitConfig.dirPtau = outputPathUpdated;
  }

  // create an instance of circomkit with a custom config
  const circomkitInstance = new Circomkit({
    ...circomKitConfig,
    verbose: false,
  });

  // loop through each circuit config and compile them
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < circuitsConfigs.length; i += 1) {
    const circuit = circuitsConfigs[i];
    // eslint-disable-next-line no-console
    console.log(`Compiling ${circuit.name}...`);

    // eslint-disable-next-line no-await-in-loop
    const outPath = await circomkitInstance.compile(circuit.name, circuit);

    // if the circuit is compiled with a c witness, then let's run make in the directory
    if (cWitness) {
      try {
        // build
        execFileSync("bash", ["-c", `cd ${outPath}/${circuit.name}_cpp && make`]);
      } catch (error) {
        throw new Error(`Failed to compile the c witness for ${circuit.name}`);
      }
    }
  }

  // return the build directory
  return circomKitConfig.dirBuild;
};

if (require.main === module) {
  (async () => {
    // check if we want to compile the c witness or not
    const cWitness = process.argv.includes("--cWitness");
    // the output path is the next argument after the --outPath flag
    // and is not mandatory
    const outputPathIndex = process.argv.indexOf("--outPath");
    if (outputPathIndex === -1) {
      await compileCircuits(cWitness);
    } else {
      const outputFolder = process.argv[outputPathIndex + 1];
      await compileCircuits(cWitness, outputFolder);
    }
  })();
}
