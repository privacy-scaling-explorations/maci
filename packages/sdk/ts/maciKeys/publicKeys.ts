import { genPubKey } from "@maci-protocol/crypto";
import { PrivKey, PubKey } from "@maci-protocol/domainobjs";

/**
 * Generate a new Maci Public key from a private key
 * @param privKey - the user private key
 * @param quiet - whether to log the output
 * @return the public key serialized
 */
export const generateMaciPublicKey = (privkey: string): string => {
  // we check that the provided private key is valid
  if (!PrivKey.isValidSerializedPrivKey(privkey)) {
    throw new Error("Invalid private key");
  }

  const unserializedKey = PrivKey.deserialize(privkey);
  const pubKey = new PubKey(genPubKey(unserializedKey.rawPrivKey));

  // we give back the serialized public key
  return pubKey.serialize();
};
