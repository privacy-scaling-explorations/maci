import { genRandomSalt, hash3 } from "@maci-protocol/crypto";

import type { IJsonStateLeaf, IStateLeaf, IStateLeafContractParams } from "./types";

import { Keypair } from "./keyPair";
import { PubKey } from "./publicKey";

/**
 * @notice A leaf in the state tree, which maps
 * public keys to voice credit balances
 */
export class StateLeaf implements IStateLeaf {
  pubKey: PubKey;

  voiceCreditBalance: bigint;

  /**
   * Create a new instance of a state leaf
   * @param pubKey the public key of the user signin up
   * @param voiceCreditBalance the voice credit balance of the user
   */
  constructor(pubKey: PubKey, voiceCreditBalance: bigint) {
    this.pubKey = pubKey;
    this.voiceCreditBalance = voiceCreditBalance;
  }

  /**
   * Crate a deep copy of the object
   * @returns a copy of the state leaf
   */
  copy(): StateLeaf {
    return new StateLeaf(this.pubKey.copy(), BigInt(this.voiceCreditBalance.toString()));
  }

  /**
   * Generate a blank state leaf
   * @returns a blank state leaf
   */
  static genBlankLeaf(): StateLeaf {
    // The public key for a blank state leaf is the first Pedersen base
    // point from iden3's circomlib implementation of the Pedersen hash.
    // Since it is generated using a hash-to-curve function, we are
    // confident that no-one knows the private key associated with this
    // public key. See:
    // https://github.com/iden3/circomlib/blob/d5ed1c3ce4ca137a6b3ca48bec4ac12c1b38957a/src/pedersen_printbases.js
    // Its hash should equal
    // 11672248758340751985123309654953904206381780234474872690580702076708041504880.
    return new StateLeaf(
      new PubKey([
        BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
        BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
      ]),
      BigInt(0),
    );
  }

  /**
   * Generate a random leaf (random salt and random key pair)
   * @returns a random state leaf
   */
  static genRandomLeaf(): StateLeaf {
    const keypair = new Keypair();
    return new StateLeaf(keypair.pubKey, genRandomSalt());
  }

  /**
   * Return this state leaf as an array of bigints
   * @returns the state leaf as an array of bigints
   */
  private asArray = (): bigint[] => [...this.pubKey.asArray(), this.voiceCreditBalance];

  /**
   * Return this state leaf as an array of bigints
   * @returns the state leaf as an array of bigints
   */
  asCircuitInputs = (): bigint[] => this.asArray();

  /**
   * Hash this state leaf (first convert as array)
   * @returns the has of the state leaf elements
   */
  hash = (): bigint => hash3(this.asArray());

  /**
   * Return this state leaf as a contract param
   * @returns the state leaf as a contract param (object)
   */
  asContractParam(): IStateLeafContractParams {
    return {
      pubKey: this.pubKey.asContractParam(),
      voiceCreditBalance: this.voiceCreditBalance.toString(),
    };
  }

  /**
   * Check if two state leaves are equal
   * @param leaf the state leaf to compare with
   * @returns whether they are equal or not
   */
  equals(leaf: StateLeaf): boolean {
    return this.pubKey.equals(leaf.pubKey) && this.voiceCreditBalance === leaf.voiceCreditBalance;
  }

  /**
   * Serialize the state leaf
   * @notice serialize the public key
   * @notice convert the voice credit balance to a hex string
   * @returns
   */
  serialize = (): string => {
    const data = [this.pubKey.serialize(), this.voiceCreditBalance.toString(16)];

    return Buffer.from(JSON.stringify(data, null, 0), "utf8").toString("base64url");
  };

  /**
   * Deserialize the state leaf
   * @param serialized the serialized state leaf
   * @returns a deserialized state leaf
   */
  static deserialize = (serialized: string): StateLeaf => {
    const base64 = serialized.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(Buffer.from(base64, "base64").toString("utf8")) as [string, string];

    return new StateLeaf(PubKey.deserialize(json[0]), BigInt(`0x${json[1]}`));
  };

  /**
   * Serialize to a JSON object
   */
  toJSON(): IJsonStateLeaf {
    return {
      pubKey: this.pubKey.serialize(),
      voiceCreditBalance: this.voiceCreditBalance.toString(),
    };
  }

  /**
   * Deserialize into a StateLeaf instance
   * @param json - the json representation
   * @returns the deserialized object as a StateLeaf instance
   */
  static fromJSON(json: IJsonStateLeaf): StateLeaf {
    return new StateLeaf(PubKey.deserialize(json.pubKey), BigInt(json.voiceCreditBalance));
  }
}
