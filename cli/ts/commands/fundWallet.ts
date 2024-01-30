import { getDefaultSigner } from "maci-contracts";

import { info, logError, logYellow, logGreen, success, banner, type FundWalletArgs } from "../utils";

/**
 * Fund a new wallet with Ether
 * @param amount - the amount of Ether to send
 * @param address - the address of the wallet to fund
 * @param quiet - whether to log the output
 */
export const fundWallet = async ({ amount, address, signer, quiet = true }: FundWalletArgs): Promise<void> => {
  banner(quiet);
  const ethSigner = signer || (await getDefaultSigner());

  // fund the wallet by sending Ether to it
  try {
    const tx = await ethSigner.sendTransaction({
      to: address,
      value: amount.toString(),
    });
    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("Transaction failed");
    }

    logYellow(quiet, info(`Transaction hash: ${tx.hash}`));
    logGreen(quiet, success(`Successfully funded ${address} with ${amount} wei`));
  } catch (error) {
    logError((error as Error).message);
  }
};
