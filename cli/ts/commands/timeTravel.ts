import { getDefaultSigner } from "maci-contracts";

import type { JsonRpcProvider } from "ethers";

import { banner, logError, logGreen, success, type TimeTravelArgs } from "../utils";

/**
 * Utility to travel in time when using a local blockchain
 * @param seconds - the number of seconds to travel in time
 * @param quiet - whether to log the output
 */
export const timeTravel = async ({ seconds, signer, quiet = true }: TimeTravelArgs): Promise<void> => {
  banner(quiet);
  const ethSigner = signer || (await getDefaultSigner());

  try {
    // send the instructions to the provider
    await (ethSigner.provider as JsonRpcProvider).send("evm_increaseTime", [Number(seconds)]);
    await (ethSigner.provider as JsonRpcProvider).send("evm_mine", []);

    logGreen(quiet, success(`Fast-forwarded ${seconds} seconds`));
  } catch (error) {
    logError((error as Error).message);
  }
};
