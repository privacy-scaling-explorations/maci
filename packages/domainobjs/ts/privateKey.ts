import { formatPrivateKeyForBabyJub, type PrivateKey as RawPrivateKey } from "@maci-protocol/crypto";

import type { IJsonPrivateKey } from "./types";

export const SERIALIZED_PRIV_KEY_PREFIX = "macisk.";

/**
 * @notice PrivateKey is a TS Class representing a MACI PrivateKey
 * which is a seed to be used to generate a public key (point on the curve)
 * This is a MACI private key, which is not to be
 * confused with an Ethereum private key.
 * A serialized MACI private key is prefixed by 'macisk.'
 */
export class PrivateKey {
  raw: RawPrivateKey;

  /**
   * Generate a new Private key object
   * @param raw the raw private key (a bigint)
   */
  constructor(raw: RawPrivateKey) {
    this.raw = raw;
  }

  /**
   * Create a copy of this Private key
   * @returns a copy of the Private key
   */
  copy = (): PrivateKey => new PrivateKey(BigInt(this.raw.toString()));

  /**
   * Return this Private key as a circuit input
   * @returns the Private key as a circuit input
   */
  asCircuitInputs = (): string => formatPrivateKeyForBabyJub(this.raw).toString();

  /**
   * Serialize the private key
   * @returns the serialized private key
   */
  serialize = (): string => {
    let x = this.raw.toString(16);
    if (x.length % 2 !== 0) {
      x = `0${x}`;
    }

    return `${SERIALIZED_PRIV_KEY_PREFIX}${x.padStart(64, "0")}`;
  };

  /**
   * Deserialize the private key
   * @param s the serialized private key
   * @returns the deserialized private key
   */
  static deserialize = (s: string): PrivateKey => {
    const x = s.slice(SERIALIZED_PRIV_KEY_PREFIX.length);
    return new PrivateKey(BigInt(`0x${x}`));
  };

  /**
   * Check if the serialized private key is valid
   * @param serialized the serialized private key
   * @returns whether it is a valid serialized private key
   */
  static isValidSerialized = (serialized: string): boolean => {
    const correctPrefix = serialized.startsWith(SERIALIZED_PRIV_KEY_PREFIX);
    const body = serialized.slice(SERIALIZED_PRIV_KEY_PREFIX.length);

    return correctPrefix && body.length === 64;
  };

  /**
   * Serialize this object
   */
  toJSON(): IJsonPrivateKey {
    return {
      privateKey: this.serialize(),
    };
  }

  /**
   * Deserialize this object from a JSON object
   * @param json - the json object
   * @returns the deserialized object as a PrivateKey instance
   */
  static fromJSON(json: IJsonPrivateKey): PrivateKey {
    return PrivateKey.deserialize(json.privateKey);
  }
}
