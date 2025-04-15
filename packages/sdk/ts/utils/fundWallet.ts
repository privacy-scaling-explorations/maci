import type { IFundWalletArgs } from "./types";

/**
 * Fund a new wallet with Ether
 * @param args Fund wallet arguments
 */
export const fundWallet = async ({ amount, address, signer }: IFundWalletArgs): Promise<string> => {
  const tx = await signer.sendTransaction({
    to: address,
    value: amount.toString(),
  });
  const receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error("Transaction failed");
  }

  return receipt.hash;
};
