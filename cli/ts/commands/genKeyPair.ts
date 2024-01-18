import { Keypair } from "maci-domainobjs";

import { logGreen, success, banner } from "../utils";

/**
 * Generate a new Maci Key Pair
 * and print it to the screen
 * @param quiet - whether to log the output
 */
export const genKeyPair = (quiet = true): { publicKey: string; privateKey: string } => {
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
