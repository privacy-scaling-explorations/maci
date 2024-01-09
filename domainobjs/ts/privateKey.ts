import { SNARK_FIELD_SIZE, formatPrivKeyForBabyJub, type PrivKey as RawPrivKey } from "maci-crypto";

import type { IJsonPrivateKey } from "./types";

export const SERIALIZED_PRIV_KEY_PREFIX = "macisk.";

/**
 * @notice PrivKey is a TS Class representing a MACI PrivateKey (on the jubjub curve)
 * This is a MACI private key, which is not to be
 * confused with an Ethereum private key.
 * A serialized MACI private key is prefixed by 'macisk.'
 * A raw MACI private key can be thought as a point on the baby jubjub curve
 */
export class PrivKey {
  rawPrivKey: RawPrivKey;

  /**
   * Generate a new Private key object
   * @param rawPrivKey the raw private key (a bigint)
   */
  constructor(rawPrivKey: RawPrivKey) {
    this.rawPrivKey = rawPrivKey;
  }

  /**
   * Create a copy of this Private key
   * @returns a copy of the Private key
   */
  copy = (): PrivKey => new PrivKey(BigInt(this.rawPrivKey.toString()));

  /**
   * Return this Private key as a circuit input
   * @returns the Private key as a circuit input
   */
  asCircuitInputs = (): string => formatPrivKeyForBabyJub(this.rawPrivKey).toString();

  /**
   * Serialize the private key
   * @returns the serialized private key
   */
  serialize = (): string => {
    let x = this.rawPrivKey.toString(16);
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
  static deserialize = (s: string): PrivKey => {
    const x = s.slice(SERIALIZED_PRIV_KEY_PREFIX.length);
    return new PrivKey(BigInt(`0x${x}`));
  };

  /**
   * Check if the serialized private key is valid
   * @param s the serialized private key
   * @returns whether it is a valid serialized private key
   */
  static isValidSerializedPrivKey = (s: string): boolean => {
    const correctPrefix = s.startsWith(SERIALIZED_PRIV_KEY_PREFIX);
    const x = s.slice(SERIALIZED_PRIV_KEY_PREFIX.length);

    try {
      const value = BigInt(`0x${x}`);
      return correctPrefix && value < SNARK_FIELD_SIZE;
    } catch {
      return false;
    }
  };

  /**
   * Serialize this object
   */
  toJSON(): IJsonPrivateKey {
    return {
      privKey: this.serialize(),
    };
  }

  /**
   * Deserialize this object from a JSON object
   * @param json - the json object
   * @returns the deserialized object as a PrivKey instance
   */
  static fromJSON(json: IJsonPrivateKey): PrivKey {
    return PrivKey.deserialize(json.privKey);
  }
}
