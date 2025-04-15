import { SNARK_FIELD_SIZE } from "maci-crypto";
import { Keypair, PrivKey } from "maci-domainobjs";

import type { IGenKeypairArgs } from "../utils/interfaces";

import { banner } from "../utils/banner";
import { logGreen, success } from "../utils/theme";

/**
 * Generate a new Maci Key Pair
 * and print it to the screen
 * @param {IGenKeypairArgs} args - keypair generation params
 * @returns - keypair
 */
export const genKeyPair = ({ seed, quiet = true }: IGenKeypairArgs): { publicKey: string; privateKey: string } => {
  banner(quiet);
  // create the new random keypair if there is no seed value
  const keypair = new Keypair(seed ? new PrivKey(seed % SNARK_FIELD_SIZE) : undefined);

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
