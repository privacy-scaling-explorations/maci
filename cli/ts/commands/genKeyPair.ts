import { Keypair } from "maci-domainobjs";
import { banner } from "../utils/banner";
import { logGreen, success } from "../utils/theme";

/**
 * Generate a new Maci Key Pair
 * and print it to the screen
 * @param quiet - whether to log the output
 */
export const genKeyPair = (quiet = true) => {
    if (!quiet) banner();
    // create the new rando keypair
    const keypair = new Keypair();

    // serialize both private and public keys
    const serializedPubKey = keypair.pubKey.serialize();
    const serializedPrivKey = keypair.privKey.serialize();

    if (!quiet) logGreen(success(`Public key: ${serializedPubKey}`));
    if (!quiet) logGreen(success(`Private key: ${serializedPrivKey}`));

    return {
        publicKey: serializedPubKey,
        privateKey: serializedPrivKey,
    };
};
