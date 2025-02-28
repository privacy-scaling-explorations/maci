import type { ITimeTravelArgs } from "./types";
import type { JsonRpcProvider } from "ethers";

/**
 * Utility to travel in time when using a local blockchain
 * @param args time travel args
 */
export const timeTravel = async ({ seconds, signer }: ITimeTravelArgs): Promise<void> => {
  // send the instructions to the provider
  await (signer.provider as JsonRpcProvider).send("evm_increaseTime", [Number(seconds)]);
  await (signer.provider as JsonRpcProvider).send("evm_mine", []);
};
