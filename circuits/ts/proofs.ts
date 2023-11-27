import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { tmpdir } from "os";
import { zKey, groth16 } from "snarkjs";
import { stringifyBigInts } from "maci-crypto";
import { cleanThreads, isArm } from "./utils";

/**
 * Generate a zk-SNARK proof
 * @dev if running on a intel chip we use rapidsnark for
 * speed - on the other hand if running on ARM we need to use
 * snark and a WASM witness
 * @param inputs - the inputs to the circuit
 * @param zkeyPath - the path to the zkey
 * @param rapidsnarkExePath - the path to the rapidnsark binary
 * @param witnessExePath - the path to the compiled witness binary
 * @param wasmPath - the path to the wasm witness
 * @param silent - whether we want to print to the console or not
 * @returns the zk-SNARK proof
 */
export const genProof = async (
  inputs: string[],
  zkeyPath: string,
  rapidsnarkExePath?: string,
  witnessExePath?: string,
  wasmPath?: string,
  silent = true,
): Promise<any> => {
  // if we are running on an arm chip we can use snarkjs directly
  if (isArm()) {
    const { proof, publicSignals } = await groth16.fullProve(inputs, wasmPath, zkeyPath);
    return { proof, publicSignals };
  }
  // intel chip flow (use rapidnsark)
  // Create tmp directory
  const tmpPath = join(tmpdir(), `tmp-${Date.now()}`);
  mkdirSync(tmpPath, { recursive: true });

  const inputJsonPath = join(tmpPath, "input.json");
  const outputWtnsPath = join(tmpPath, "output.wtns");
  const proofJsonPath = join(tmpPath, "proof.json");
  const publicJsonPath = join(tmpPath, "public.json");

  // Write input.json
  const jsonData = JSON.stringify(stringifyBigInts(inputs));
  writeFileSync(inputJsonPath, jsonData);

  // Generate the witness
  const witnessGenCmd = `${witnessExePath} ${inputJsonPath} ${outputWtnsPath}`;

  try {
    execSync(witnessGenCmd, { stdio: silent ? "ignore" : "pipe" });

    if (!existsSync(outputWtnsPath)) {
      throw new Error("Error executing " + witnessGenCmd);
    }
  } catch (error: any) {
    throw new Error("Error executing " + witnessGenCmd + " " + error.message);
  }

  // Generate the proof
  const proofGenCmd = `${rapidsnarkExePath} ${zkeyPath} ${outputWtnsPath} ${proofJsonPath} ${publicJsonPath}`;
  try {
    execSync(proofGenCmd, { stdio: silent ? "ignore" : "pipe" });

    if (!existsSync(proofJsonPath)) {
      throw new Error("Error executing " + proofGenCmd);
    }
  } catch (error: any) {
    throw new Error("Error executing " + proofGenCmd + " " + error.message);
  }

  // Read the proof and public inputs
  const proof = JSON.parse(readFileSync(proofJsonPath).toString());
  const publicSignals = JSON.parse(readFileSync(publicJsonPath).toString());

  // remove all artifacts
  for (const f of [proofJsonPath, publicJsonPath, inputJsonPath, outputWtnsPath]) if (existsSync(f)) unlinkSync(f);

  // remove tmp directory
  rmdirSync(tmpPath);

  return { proof, publicSignals };
};

/**
 * Verify a zk-SNARK proof using snarkjs
 * @param publicInputs - the public inputs to the circuit
 * @param proof - the proof
 * @param vk - the verification key
 * @returns whether the proof is valid or not
 */
export const verifyProof = async (publicInputs: any, proof: any, vk: any): Promise<boolean> => {
  const isValid = await groth16.verify(vk, publicInputs, proof);
  await cleanThreads();
  return isValid;
};

/**
 * Extract the Verification Key from a zKey
 * @param zkeyPath - the path to the zKey
 * @returns the verification key
 */
export const extractVk = async (zkeyPath: string) => {
  const vk = await zKey.exportVerificationKey(zkeyPath);
  await cleanThreads();
  return vk;
};
