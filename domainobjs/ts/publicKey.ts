import { SNARK_FIELD_SIZE, hashLeftRight, packPubKey, unpackPubKey, type PubKey as RawPubKey } from "maci-crypto";

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
export class PubKey {
  rawPubKey: RawPubKey;

  /**
   * Create a new instance of a public key
   * @param rawPubKey the raw public key
   */
  constructor(rawPubKey: RawPubKey) {
    assert(rawPubKey[0] < SNARK_FIELD_SIZE);
    assert(rawPubKey[1] < SNARK_FIELD_SIZE);
    this.rawPubKey = rawPubKey;
  }

  /**
   * Create a copy of the public key
   * @returns a copy of the public key
   */
  copy = (): PubKey => new PubKey([BigInt(this.rawPubKey[0].toString()), BigInt(this.rawPubKey[1].toString())]);

  /**
   * Return this public key as smart contract parameters
   * @returns the public key as smart contract parameters
   */
  asContractParam = (): IG1ContractParams => {
    const [x, y] = this.rawPubKey;

    return {
      x: x.toString(),
      y: y.toString(),
    };
  };

  /**
   * Return this public key as circuit inputs
   * @returns an array of strings
   */
  asCircuitInputs = (): string[] => this.rawPubKey.map((x) => x.toString());

  /**
   * Return this public key as an array of bigints
   * @returns the public key as an array of bigints
   */
  asArray = (): bigint[] => [this.rawPubKey[0], this.rawPubKey[1]];

  /**
   * Generate a serialized public key from this public key object
   * @returns the string representation of a serialized public key
   */
  serialize = (): string => {
    const { x, y } = this.asContractParam();
    // Blank leaves have pubkey [0, 0], which packPubKey does not support
    if (BigInt(x) === BigInt(0) && BigInt(y) === BigInt(0)) {
      return `${SERIALIZED_PUB_KEY_PREFIX}z`;
    }

    const packed = packPubKey(this.rawPubKey).toString(16);

    if (packed.length % 2 !== 0) {
      return `${SERIALIZED_PUB_KEY_PREFIX}0${packed}`;
    }

    return `${SERIALIZED_PUB_KEY_PREFIX}${packed}`;
  };

  /**
   * Hash the two baby jubjub coordinates
   * @returns the hash of this public key
   */
  hash = (): bigint => hashLeftRight(this.rawPubKey[0], this.rawPubKey[1]);

  /**
   * Check whether this public key equals to another public key
   * @param p the public key to compare with
   * @returns whether they match
   */
  equals = (p: PubKey): boolean => this.rawPubKey[0] === p.rawPubKey[0] && this.rawPubKey[1] === p.rawPubKey[1];

  /**
   * Deserialize a serialized public key
   * @param s the serialized public key
   * @returns the deserialized public key
   */
  static deserialize = (s: string): PubKey => {
    // Blank leaves have pubkey [0, 0], which packPubKey does not support
    if (s === `${SERIALIZED_PUB_KEY_PREFIX}z`) {
      return new PubKey([BigInt(0), BigInt(0)]);
    }

    const len = SERIALIZED_PUB_KEY_PREFIX.length;
    return new PubKey(unpackPubKey(BigInt(`0x${s.slice(len).toString()}`)));
  };

  /**
   * Check whether a serialized public key is serialized correctly
   * @param s the serialized public key
   * @returns whether the serialized public key is valid
   */
  static isValidSerializedPubKey = (s: string): boolean => {
    const correctPrefix = s.startsWith(SERIALIZED_PUB_KEY_PREFIX);

    try {
      PubKey.deserialize(s);
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
      pubKey: this.serialize(),
    };
  }

  /**
   * Deserialize a JSON object into a PubKey instance
   * @param json - the json object
   * @returns PubKey
   */
  static fromJSON(json: IJsonPublicKey): PubKey {
    return PubKey.deserialize(json.pubKey);
  }
}
