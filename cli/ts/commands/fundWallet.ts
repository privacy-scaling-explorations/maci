import { getDefaultSigner } from "maci-contracts";
import {
    info,
    logError,
    logYellow,
    logGreen,
    success,
    banner,
} from "../utils/";

/**
 * Fund a new wallet with Ether
 * @param amount - the amount of Ether to send
 * @param address - the address of the wallet to fund
 * @param quiet - whether to log the output
 */
export const fundWallet = async (
    amount: number,
    address: string,
    quiet = true
) => {
    if (!quiet) banner();
    const signer = await getDefaultSigner();

    // fund the wallet by sending Ether to it
    try {
        const tx = await signer.sendTransaction({
            to: address,
            value: amount.toString(),
        });
        const receipt = await tx.wait();
        if (receipt.status != 1) logError("Transaction failed");

        if (!quiet) {
            logYellow(info(`Transaction hash: ${tx.hash}`));
            logGreen(
                success(`Successfully funded ${address} with ${amount} wei`)
            );
        }
    } catch (error: any) {
        logError(error.message);
    }
};
