import { stringifyBigInts } from "maci-crypto";
import { zKey, groth16, type PublicSignals, type Groth16Proof } from "snarkjs";

import childProcess from "child_process";
import fs from "fs";
import { tmpdir } from "os";
import path from "path";

import type { IGenProofOptions, ISnarkJSVerificationKey, FullProveResult } from "./types";
import type { IVkObjectParams } from "maci-domainobjs";

import { cleanThreads, isArm } from "./utils";

/**
 * Generate a zk-SNARK proof
 * @dev if running on a intel chip we use rapidsnark for
 * speed - on the other hand if running on ARM we need to use
 * snark and a WASM witness
 * @param inputs - the inputs to the circuit
 * @param zkeyPath - the path to the zkey
 * @param useWasm - whether we want to use the wasm witness or not
 * @param rapidsnarkExePath - the path to the rapidnsark binary
 * @param witnessExePath - the path to the compiled witness binary
 * @param wasmPath - the path to the wasm witness
 * @param silent - whether we want to print to the console or not
 * @returns the zk-SNARK proof and public signals
 */
export const genProof = async ({
  inputs,
  zkeyPath,
  useWasm,
  rapidsnarkExePath,
  witnessExePath,
  wasmPath,
}: IGenProofOptions): Promise<FullProveResult> => {
  // if we want to use a wasm witness we use snarkjs
  if (useWasm) {
    if (!wasmPath) {
      throw new Error("wasmPath must be specified");
    }

    const isWasmExists = fs.existsSync(wasmPath);

    if (!isWasmExists) {
      throw new Error(`wasmPath ${wasmPath} does not exist`);
    }

    const { proof, publicSignals } = await groth16.fullProve(inputs, wasmPath, zkeyPath);
    return { proof, publicSignals };
  }

  if (isArm()) {
    throw new Error("To use rapidnsnark you currently need to be running on an intel chip");
  }

  // intel chip flow (use rapidnsark)
  // Create tmp directory
  const tmpPath = path.resolve(tmpdir(), `tmp-${Date.now()}`);
  await fs.promises.mkdir(tmpPath, { recursive: true });

  const inputJsonPath = path.resolve(tmpPath, "input.json");
  const outputWtnsPath = path.resolve(tmpPath, "output.wtns");
  const proofJsonPath = path.resolve(tmpPath, "proof.json");
  const publicJsonPath = path.resolve(tmpPath, "public.json");

  // Write input.json
  const jsonData = JSON.stringify(stringifyBigInts(inputs));
  await fs.promises.writeFile(inputJsonPath, jsonData);

  const { promisify } = await import("util");
  const execFile = promisify(childProcess.execFile);

  // Generate the witness
  await execFile(witnessExePath!, [inputJsonPath, outputWtnsPath]);

  const isOutputWtnsExists = fs.existsSync(outputWtnsPath);

  if (!isOutputWtnsExists) {
    throw new Error(`Error executing ${witnessExePath} ${inputJsonPath} ${outputWtnsPath}`);
  }

  // Generate the proof
  await execFile(rapidsnarkExePath!, [zkeyPath, outputWtnsPath, proofJsonPath, publicJsonPath]);

  const isProofJsonPathExists = fs.existsSync(proofJsonPath);

  if (!isProofJsonPathExists) {
    throw new Error(
      `Error executing ${rapidsnarkExePath} ${zkeyPath} ${outputWtnsPath} ${proofJsonPath} ${publicJsonPath}`,
    );
  }

  // Read the proof and public inputs
  const proof = JSON.parse(await fs.promises.readFile(proofJsonPath).then((res) => res.toString())) as Groth16Proof;
  const publicSignals = JSON.parse(
    await fs.promises.readFile(publicJsonPath).then((res) => res.toString()),
  ) as PublicSignals;

  // remove all artifacts
  await Promise.all([proofJsonPath, publicJsonPath, inputJsonPath, outputWtnsPath].map(unlinkFile));

  // remove tmp directory
  await fs.promises.rmdir(tmpPath);

  return { proof, publicSignals };
};

async function unlinkFile(filepath: string): Promise<void> {
  const isFileExists = fs.existsSync(filepath);

  if (isFileExists) {
    await fs.promises.unlink(filepath);
  }
}

/**
 * Verify a zk-SNARK proof using snarkjs
 * @param publicInputs - the public inputs to the circuit
 * @param proof - the proof
 * @param vk - the verification key
 * @param cleanup - whether to cleanup the threads or not
 * @returns whether the proof is valid or not
 */
export const verifyProof = async (
  publicInputs: PublicSignals,
  proof: Groth16Proof,
  vk: ISnarkJSVerificationKey,
  cleanup = true,
): Promise<boolean> => {
  const isValid = await groth16.verify(vk, publicInputs, proof);
  if (cleanup) {
    await cleanThreads();
  }
  return isValid;
};

/**
 * Extract the Verification Key from a zKey
 * @param zkeyPath - the path to the zKey
 * @param cleanup - whether to cleanup the threads or not
 * @returns the verification key
 */
export const extractVk = async (zkeyPath: string, cleanup = true): Promise<IVkObjectParams> =>
  zKey
    .exportVerificationKey(zkeyPath)
    .then((vk) => vk as IVkObjectParams)
    .finally(() => {
      if (cleanup) {
        cleanThreads();
      }
    });
