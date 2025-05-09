import {
  inCurve,
  hashLeftRight,
  packPublicKey,
  unpackPublicKey,
  type PublicKey as RawPublicKey,
} from "@maci-protocol/crypto";

import assert from "assert";

import type { IJsonPublicKey, IG1ContractParams } from "./types";

export const SERIALIZED_PUB_KEY_PREFIX = "macipk.";

/**
 * @notice A class representing a public key
 * This is a MACI public key, which is not to be
 * confused with an Ethereum public key.
 * A serialized MACI public key is prefixed by 'macipk.'
 * A raw MACI public key can be thought as a pair of
 * BigIntegers (x, y) representing a point on the baby jubjub curve
 */
export class PublicKey {
  raw: RawPublicKey;

  /**
   * Create a new instance of a public key
   * @dev You might want to allow an invalid raw key,
   * as when decrypting invalid messages, the public key data
   * will be random, and likely not be a point on the curve.
   * However we need to match keys to the circuit which does
   * not perform such checks
   * @param raw the raw public key
   * @param allowInvalid whether to allow invalid public keys
   */
  constructor(raw: RawPublicKey, allowInvalid = false) {
    if (!allowInvalid) {
      assert(inCurve(raw), "PublicKey not on curve");
    }
    this.raw = raw;
  }

  /**
   * Create a copy of the public key
   * @returns a copy of the public key
   */
  copy = (): PublicKey => new PublicKey([BigInt(this.raw[0].toString()), BigInt(this.raw[1].toString())]);

  /**
   * Return this public key as smart contract parameters
   * @returns the public key as smart contract parameters
   */
  asContractParam = (): IG1ContractParams => {
    const [x, y] = this.raw;

    return {
      x: x.toString(),
      y: y.toString(),
    };
  };

  /**
   * Return this public key as circuit inputs
   * @returns an array of strings
   */
  asCircuitInputs = (): string[] => this.raw.map((x) => x.toString());

  /**
   * Return this public key as an array of bigints
   * @returns the public key as an array of bigints
   */
  asArray = (): bigint[] => [this.raw[0], this.raw[1]];

  /**
   * Generate a serialized public key from this public key object
   * @returns the string representation of a serialized public key
   */
  serialize = (): string => {
    const packed = packPublicKey(this.raw).toString(16);

    if (packed.length % 2 !== 0) {
      return `${SERIALIZED_PUB_KEY_PREFIX}0${packed}`;
    }

    return `${SERIALIZED_PUB_KEY_PREFIX}${packed}`;
  };

  /**
   * Hash the two baby jubjub coordinates
   * @returns the hash of this public key
   */
  hash = (): bigint => hashLeftRight(this.raw[0], this.raw[1]);

  /**
   * Check whether this public key equals to another public key
   * @param key the public key to compare with
   * @returns whether they match
   */
  equals = (key: PublicKey): boolean => this.raw[0] === key.raw[0] && this.raw[1] === key.raw[1];

  /**
   * Deserialize a serialized public key
   * @param s the serialized public key
   * @returns the deserialized public key
   */
  static deserialize = (s: string): PublicKey => {
    const len = SERIALIZED_PUB_KEY_PREFIX.length;
    return new PublicKey(unpackPublicKey(BigInt(`0x${s.slice(len).toString()}`)));
  };

  /**
   * Check whether a serialized public key is serialized correctly
   * @param s the serialized public key
   * @returns whether the serialized public key is valid
   */
  static isValidSerialized = (s: string): boolean => {
    const correctPrefix = s.startsWith(SERIALIZED_PUB_KEY_PREFIX);

    try {
      PublicKey.deserialize(s);
      return correctPrefix;
    } catch {
      return false;
    }
  };

  /**
   * Serialize this object
   */
  toJSON(): IJsonPublicKey {
    return {
      publicKey: this.serialize(),
    };
  }

  /**
   * Deserialize a JSON object into a PublicKey instance
   * @param json - the json object
   * @returns PublicKey
   */
  static fromJSON(json: IJsonPublicKey): PublicKey {
    return PublicKey.deserialize(json.publicKey);
  }

  /**
   * Generate a default padding key
   * @returns a default padding key
   */
  static generatePaddingKey(): PublicKey {
    // This public key is the first Pedersen base
    // point from iden3's circomlib implementation of the Pedersen hash.
    // Since it is generated using a hash-to-curve function, we are
    // confident that no-one knows the private key associated with this
    // public key. See:
    // https://github.com/iden3/circomlib/blob/d5ed1c3ce4ca137a6b3ca48bec4ac12c1b38957a/src/pedersen_printbases.js
    return new PublicKey([
      BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
      BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
    ]);
  }
}
