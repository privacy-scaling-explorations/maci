import { deployConstantInitialVoiceCreditProxy, deployFreeForAllSignUpGatekeeper, deployMaci } from "maci-sdk";
import { DEFAULT_INITIAL_VOICE_CREDITS, STATE_TREE_DEPTH } from "./constants";
import { JsonRpcProvider, Signer } from "ethers";
import { IMaciContracts, TimeTravelArgs } from "./types";

import fs from "fs";
/**
 * Test function to deploy MACI contracts
 */
export const deployMaciContracts = async (signer: Signer): Promise<IMaciContracts> => {
  const voiceCreditProxy = await deployConstantInitialVoiceCreditProxy(DEFAULT_INITIAL_VOICE_CREDITS, signer, true);

  const signupGatekeeper = await deployFreeForAllSignUpGatekeeper(signer, true);

  const { maciContract } = await deployMaci({
    signUpTokenGatekeeperContractAddress: await signupGatekeeper.getAddress(),
    stateTreeDepth: STATE_TREE_DEPTH,
    signer,
    quiet: true,
  });

  return {
    maciAddress: await maciContract.getAddress(),
    voiceCreditProxy: await voiceCreditProxy.getAddress(),
    signupGatekeeper: await signupGatekeeper.getAddress(),
  };
};

/**
 * Utility to travel in time when using a local blockchain
 * @param seconds - the number of seconds to travel in time
 * @param quiet - whether to log the output
 */
export const timeTravel = async ({ seconds, signer }: TimeTravelArgs): Promise<void> => {
  // send the instructions to the provider
  await (signer.provider as JsonRpcProvider).send("evm_increaseTime", [Number(seconds)]);
  await (signer.provider as JsonRpcProvider).send("evm_mine", []);
};

/**
 * Read a JSON file from disk
 * @param path - the path of the file
 * @returns the JSON object
 */
export const readJSONFile = async (path: string): Promise<Record<string, Record<string, string> | undefined>> => {
  const isExists = fs.existsSync(path);

  if (!isExists) {
    throw new Error(`File ${path} does not exist`);
  }

  return JSON.parse(await fs.promises.readFile(path).then((res) => res.toString())) as Record<
    string,
    Record<string, string> | undefined
  >;
};
