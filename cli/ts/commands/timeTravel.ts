import { getDefaultSigner } from "maci-contracts";

import type { JsonRpcProvider } from "ethers";

import { banner, logError, logGreen, success } from "../utils";

/**
 * Utility to travel in time when using a local blockchain
 * @param seconds - the number of seconds to travel in time
 * @param quiet - whether to log the output
 */
export const timeTravel = async (seconds: number, quiet = true): Promise<void> => {
  banner(quiet);
  const signer = await getDefaultSigner();

  try {
    // send the instructions to the provider
    await (signer.provider as JsonRpcProvider).send("evm_increaseTime", [Number(seconds)]);
    await (signer.provider as JsonRpcProvider).send("evm_mine", []);

    logGreen(quiet, success(`Fast-forwarded ${seconds} seconds`));
  } catch (error) {
    logError((error as Error).message);
  }
};
