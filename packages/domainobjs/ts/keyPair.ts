import { EcdhSharedKey, genEcdhSharedKey, genKeypair, genPubKey } from "@maci-protocol/crypto";

import assert from "assert";

import type { IJsonKeyPair } from "./types";

import { PrivateKey } from "./privateKey";
import { PublicKey } from "./publicKey";

/**
 * @notice A KeyPair is a pair of public and private keys
 * This is a MACI keypair, which is not to be
 * confused with an Ethereum public and private keypair.
 * A MACI keypair is comprised of a MACI public key and a MACI private key
 */
export class Keypair {
  privateKey: PrivateKey;

  publicKey: PublicKey;

  /**
   * Create a new instance of a Keypair
   * @param privateKey the private key (optional)
   * @notice if no privateKey is passed, it will automatically generate a new private key
   */
  constructor(privateKey?: PrivateKey) {
    if (privateKey) {
      this.privateKey = privateKey;
      this.publicKey = new PublicKey(genPubKey(privateKey.rawPrivKey));
    } else {
      const rawKeyPair = genKeypair();
      this.privateKey = new PrivateKey(rawKeyPair.privateKey);
      this.publicKey = new PublicKey(rawKeyPair.publicKey);
    }
  }

  /**
   * Create a deep clone of this Keypair
   * @returns a copy of the Keypair
   */
  copy = (): Keypair => new Keypair(this.privateKey.copy());

  /**
   * Generate a shared key
   * @param privateKey
   * @param publicKey
   * @returns
   */
  static genEcdhSharedKey(privateKey: PrivateKey, publicKey: PublicKey): EcdhSharedKey {
    return genEcdhSharedKey(privateKey.rawPrivKey, publicKey.rawPubKey);
  }

  /**
   * Check whether two Keypairs are equal
   * @param keypair the keypair to compare with
   * @returns whether they are equal or not
   */
  equals(keypair: Keypair): boolean {
    const equalPrivKey = this.privateKey.rawPrivKey === keypair.privateKey.rawPrivKey;
    const equalPubKey =
      this.publicKey.rawPubKey[0] === keypair.publicKey.rawPubKey[0] &&
      this.publicKey.rawPubKey[1] === keypair.publicKey.rawPubKey[1];

    // If this assertion fails, something is very wrong and this function
    // should not return anything
    // eslint-disable-next-line no-bitwise
    assert(!(+equalPrivKey ^ +equalPubKey));

    return equalPrivKey;
  }

  /**
   * Serialize into a JSON object
   */
  toJSON(): IJsonKeyPair {
    return {
      privateKey: this.privateKey.serialize(),
      publicKey: this.publicKey.serialize(),
    };
  }

  /**
   * Deserialize into a Keypair instance
   * @param json
   * @returns a keypair instance
   */
  static fromJSON(json: IJsonKeyPair): Keypair {
    return new Keypair(PrivateKey.deserialize(json.privateKey));
  }
}
