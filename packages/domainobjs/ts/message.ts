import { hash12 } from "@maci-protocol/crypto";

import assert from "assert";

import type { PublicKey } from "./publicKey";
import type { IMessageContractParams } from "./types";

/**
 * @notice An encrypted command and signature.
 */
export class Message {
  data: bigint[];

  static DATA_LENGTH = 10;

  /**
   * Create a new instance of a Message
   * @param msgType the type of the message
   * @param data the data of the message
   */
  constructor(data: bigint[]) {
    assert(data.length === Message.DATA_LENGTH);
    this.data = data;
  }

  /**
   * Return the message as an array of bigints
   * @returns the message as an array of bigints
   */
  private asArray = (): bigint[] => this.data;

  /**
   * Return the message as a contract param
   * @returns the message as a contract param
   */
  asContractParam = (): IMessageContractParams => ({
    data: this.data.map((x: bigint) => x.toString()),
  });

  /**
   * Return the message as a circuit input
   * @returns the message as a circuit input
   */
  asCircuitInputs = (): bigint[] => this.asArray();

  /**
   * Hash the message data and a public key
   * @param encryptionPublicKey the public key that is used to encrypt this message
   * @returns the hash of the message data and the public key
   */
  hash = (encryptionPublicKey: PublicKey): bigint => hash12([...this.data, ...encryptionPublicKey.raw]);

  /**
   * Create a copy of the message
   * @returns a copy of the message
   */
  copy = (): Message => new Message(this.data.map((x: bigint) => BigInt(x.toString())));

  /**
   * Check if two messages are equal
   * @param m the message to compare with
   * @returns the result of the comparison
   */
  equals = (m: Message): boolean => {
    if (this.data.length !== m.data.length) {
      return false;
    }

    return this.data.every((data, index) => data === m.data[index]);
  };

  /**
   * Serialize to a JSON object
   */
  toJSON(): IMessageContractParams {
    return this.asContractParam();
  }

  /**
   * Deserialize into a Message instance
   * @param json - the json representation
   * @returns the deserialized object as a Message instance
   */
  static fromJSON(json: IMessageContractParams): Message {
    return new Message(json.data.map((x) => BigInt(x)));
  }
}
