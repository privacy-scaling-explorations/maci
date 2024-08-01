import { EcdhSharedKey, genEcdhSharedKey, genKeypair, genPubKey } from "maci-crypto";

import assert from "assert";

import type { IJsonKeyPair } from "./types";

import { PrivKey } from "./privateKey";
import { PubKey } from "./publicKey";

/**
 * @notice A KeyPair is a pair of public and private keys
 * This is a MACI keypair, which is not to be
 * confused with an Ethereum public and private keypair.
 * A MACI keypair is comprised of a MACI public key and a MACI private key
 */
export class Keypair {
  privKey: PrivKey;

  pubKey: PubKey;

  /**
   * Create a new instance of a Keypair
   * @param privKey the private key (optional)
   * @notice if no privKey is passed, it will automatically generate a new private key
   */
  constructor(privKey?: PrivKey) {
    if (privKey) {
      this.privKey = privKey;
      this.pubKey = new PubKey(genPubKey(privKey.rawPrivKey));
    } else {
      const rawKeyPair = genKeypair();
      this.privKey = new PrivKey(rawKeyPair.privKey);
      this.pubKey = new PubKey(rawKeyPair.pubKey);
    }
  }

  /**
   * Create a deep clone of this Keypair
   * @returns a copy of the Keypair
   */
  copy = (): Keypair => new Keypair(this.privKey.copy());

  /**
   * Generate a shared key
   * @param privKey
   * @param pubKey
   * @returns
   */
  static genEcdhSharedKey(privKey: PrivKey, pubKey: PubKey): EcdhSharedKey {
    return genEcdhSharedKey(privKey.rawPrivKey, pubKey.rawPubKey);
  }

  /**
   * Check whether two Keypairs are equal
   * @param keypair the keypair to compare with
   * @returns whether they are equal or not
   */
  equals(keypair: Keypair): boolean {
    const equalPrivKey = this.privKey.rawPrivKey === keypair.privKey.rawPrivKey;
    const equalPubKey =
      this.pubKey.rawPubKey[0] === keypair.pubKey.rawPubKey[0] &&
      this.pubKey.rawPubKey[1] === keypair.pubKey.rawPubKey[1];

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
      privKey: this.privKey.serialize(),
      pubKey: this.pubKey.serialize(),
    };
  }

  /**
   * Deserialize into a Keypair instance
   * @param json
   * @returns a keypair instance
   */
  static fromJSON(json: IJsonKeyPair): Keypair {
    return new Keypair(PrivKey.deserialize(json.privKey));
  }
}
