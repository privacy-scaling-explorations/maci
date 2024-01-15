import { stringifyBigInts } from "maci-crypto";
import {
  zKey,
  groth16,
  type FullProveResult,
  type PublicSignals,
  type Groth16Proof,
  type ISnarkJSVerificationKey,
} from "snarkjs";

import { execFileSync } from "child_process";
import fs from "fs";
import { tmpdir } from "os";
import path from "path";

import type { IGenProofOptions } from "./types";

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
  silent = false,
}: IGenProofOptions): Promise<FullProveResult> => {
  // if we want to use a wasm witness we use snarkjs
  if (useWasm) {
    if (!wasmPath) {
      throw new Error("wasmPath must be specified");
    }

    if (!fs.existsSync(wasmPath)) {
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
  fs.mkdirSync(tmpPath, { recursive: true });

  const inputJsonPath = path.resolve(tmpPath, "input.json");
  const outputWtnsPath = path.resolve(tmpPath, "output.wtns");
  const proofJsonPath = path.resolve(tmpPath, "proof.json");
  const publicJsonPath = path.resolve(tmpPath, "public.json");

  // Write input.json
  const jsonData = JSON.stringify(stringifyBigInts(inputs));
  fs.writeFileSync(inputJsonPath, jsonData);

  // Generate the witness
  execFileSync(witnessExePath!, [inputJsonPath, outputWtnsPath], { stdio: silent ? "ignore" : "pipe" });

  if (!fs.existsSync(outputWtnsPath)) {
    throw new Error(`Error executing ${witnessExePath} ${inputJsonPath} ${outputWtnsPath}`);
  }

  // Generate the proof
  execFileSync(rapidsnarkExePath!, [zkeyPath, outputWtnsPath, proofJsonPath, publicJsonPath], {
    stdio: silent ? "ignore" : "pipe",
  });

  if (!fs.existsSync(proofJsonPath)) {
    throw new Error(
      `Error executing ${rapidsnarkExePath} ${zkeyPath} ${outputWtnsPath} ${proofJsonPath} ${publicJsonPath}`,
    );
  }

  // Read the proof and public inputs
  const proof = JSON.parse(fs.readFileSync(proofJsonPath).toString()) as Groth16Proof;
  const publicSignals = JSON.parse(fs.readFileSync(publicJsonPath).toString()) as PublicSignals;

  // remove all artifacts
  [proofJsonPath, publicJsonPath, inputJsonPath, outputWtnsPath].forEach((f) => {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
    }
  });

  // remove tmp directory
  fs.rmdirSync(tmpPath);

  return { proof, publicSignals };
};

/**
 * Verify a zk-SNARK proof using snarkjs
 * @param publicInputs - the public inputs to the circuit
 * @param proof - the proof
 * @param vk - the verification key
 * @returns whether the proof is valid or not
 */
export const verifyProof = async (
  publicInputs: PublicSignals,
  proof: Groth16Proof,
  vk: ISnarkJSVerificationKey,
): Promise<boolean> => {
  const isValid = await groth16.verify(vk, publicInputs, proof);
  await cleanThreads();
  return isValid;
};

/**
 * Extract the Verification Key from a zKey
 * @param zkeyPath - the path to the zKey
 * @returns the verification key
 */
export const extractVk = async (zkeyPath: string): Promise<ISnarkJSVerificationKey> => {
  const vk = await zKey.exportVerificationKey(zkeyPath);
  await cleanThreads();
  return vk;
};
