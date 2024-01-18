import { genPubKey } from "maci-crypto";
import { PrivKey, PubKey } from "maci-domainobjs";

import { banner, logError, logGreen, success } from "../utils";

/**
 * Generate a new Maci Public key from a private key
 * @param privKey - the user private key
 * @param quiet - whether to log the output
 * @return the public key serialized
 */
export const genMaciPubKey = (privkey: string, quiet = true): string => {
  banner(quiet);

  // we check that the provided private key is valid
  if (!PrivKey.isValidSerializedPrivKey(privkey)) {
    logError("Invalid private key");
  }

  const unserializedKey = PrivKey.deserialize(privkey);
  const pubKey = new PubKey(genPubKey(unserializedKey.rawPrivKey));

  logGreen(quiet, success(`Public key: ${pubKey.serialize()}`));
  // we give back the serialized public key
  return pubKey.serialize();
};
