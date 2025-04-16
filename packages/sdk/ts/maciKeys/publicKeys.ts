import { genPubKey } from "@maci-protocol/crypto";
import { PrivateKey, PublicKey } from "@maci-protocol/domainobjs";

/**
 * Generate a new Maci Public key from a private key
 * @param privateKey - the user private key
 * @param quiet - whether to log the output
 * @return the public key serialized
 */
export const generateMaciPublicKey = (privateKey: string): string => {
  // we check that the provided private key is valid
  if (!PrivateKey.isValidSerializedPrivKey(privateKey)) {
    throw new Error("Invalid private key");
  }

  const unserializedKey = PrivateKey.deserialize(privateKey);
  const publicKey = new PublicKey(genPubKey(unserializedKey.rawPrivKey));

  // we give back the serialized public key
  return publicKey.serialize();
};
