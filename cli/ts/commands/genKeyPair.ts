import { Keypair } from "maci-domainobjs";
import { banner } from "../utils/banner";
import { logGreen, success } from "../utils/theme";

/**
 * Generate a new Maci Key Pair
 * and print it to the screen
 * @param quiet - whether to log the output
 */
export const genKeyPair = (quiet = true) => {
     banner(quiet);
    // create the new rando keypair
    const keypair = new Keypair();

    // serialize both private and public keys
    const serializedPubKey = keypair.pubKey.serialize();
    const serializedPrivKey = keypair.privKey.serialize();

    logGreen(quiet, success(`Public key: ${serializedPubKey}`));
    logGreen(quiet, success(`Private key: ${serializedPrivKey}`));

    return {
        publicKey: serializedPubKey,
        privateKey: serializedPrivKey,
    };
};
