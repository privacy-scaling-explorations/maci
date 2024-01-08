import {
  poseidonDecrypt,
  poseidonEncrypt,
  genRandomSalt,
  hash4,
  sign,
  verifySignature,
  type Signature,
  type Ciphertext,
  type EcdhSharedKey,
  type Point,
} from "maci-crypto";

import assert from "assert";

import type { ICommand, IJsonPCommand } from "./types";
import type { PrivKey } from "../privateKey";

import { Message } from "../message";
import { PubKey } from "../publicKey";

export interface IDecryptMessage {
  command: PCommand;
  signature: Signature;
}

/**
 * @notice Unencrypted data whose fields include the user's public key, vote etc.
 * This represents a Vote command.
 */
export class PCommand implements ICommand {
  cmdType: bigint;

  stateIndex: bigint;

  newPubKey: PubKey;

  voteOptionIndex: bigint;

  newVoteWeight: bigint;

  nonce: bigint;

  pollId: bigint;

  salt: bigint;

  /**
   * Create a new PCommand
   * @param stateIndex the state index of the user
   * @param newPubKey the new public key of the user
   * @param voteOptionIndex the index of the vote option
   * @param newVoteWeight the new vote weight of the user
   * @param nonce the nonce of the message
   * @param pollId the poll ID
   * @param salt the salt of the message
   */
  constructor(
    stateIndex: bigint,
    newPubKey: PubKey,
    voteOptionIndex: bigint,
    newVoteWeight: bigint,
    nonce: bigint,
    pollId: bigint,
    salt: bigint = genRandomSalt(),
  ) {
    this.cmdType = BigInt(1);

    const limit50Bits = BigInt(2 ** 50);
    assert(limit50Bits >= stateIndex);
    assert(limit50Bits >= voteOptionIndex);
    assert(limit50Bits >= newVoteWeight);
    assert(limit50Bits >= nonce);
    assert(limit50Bits >= pollId);

    this.stateIndex = stateIndex;
    this.newPubKey = newPubKey;
    this.voteOptionIndex = voteOptionIndex;
    this.newVoteWeight = newVoteWeight;
    this.nonce = nonce;
    this.pollId = pollId;
    this.salt = salt;
  }

  /**
   * Create a deep clone of this PCommand
   * @returns a copy of the PCommand
   */
  copy = <T extends PCommand>(): T =>
    new PCommand(
      BigInt(this.stateIndex.toString()),
      this.newPubKey.copy(),
      BigInt(this.voteOptionIndex.toString()),
      BigInt(this.newVoteWeight.toString()),
      BigInt(this.nonce.toString()),
      BigInt(this.pollId.toString()),
      BigInt(this.salt.toString()),
    ) as unknown as T;

  /**
   * @notice Returns this Command as an array. Note that 5 of the Command's fields
   * are packed into a single 250-bit value. This allows Messages to be
   * smaller and thereby save gas when the user publishes a message.
   * @returns bigint[] - the command as an array
   */
  asArray = (): bigint[] => {
    /* eslint-disable no-bitwise */
    const params =
      BigInt(this.stateIndex) +
      (BigInt(this.voteOptionIndex) << BigInt(50)) +
      (BigInt(this.newVoteWeight) << BigInt(100)) +
      (BigInt(this.nonce) << BigInt(150)) +
      (BigInt(this.pollId) << BigInt(200));
    /* eslint-enable no-bitwise */

    const command = [params, ...this.newPubKey.asArray(), this.salt];
    assert(command.length === 4);

    return command;
  };

  asCircuitInputs = (): bigint[] => this.asArray();

  /*
   * Check whether this command has deep equivalence to another command
   */
  equals = (command: PCommand): boolean =>
    this.stateIndex === command.stateIndex &&
    this.newPubKey.equals(command.newPubKey) &&
    this.voteOptionIndex === command.voteOptionIndex &&
    this.newVoteWeight === command.newVoteWeight &&
    this.nonce === command.nonce &&
    this.pollId === command.pollId &&
    this.salt === command.salt;

  hash = (): bigint => hash4(this.asArray());

  /**
   * @notice Signs this command and returns a Signature.
   */
  sign = (privKey: PrivKey): Signature => sign(privKey.rawPrivKey, this.hash());

  /**
   * @notice Returns true if the given signature is a correct signature of this
   * command and signed by the private key associated with the given public
   * key.
   */
  verifySignature = (signature: Signature, pubKey: PubKey): boolean =>
    verifySignature(this.hash(), signature, pubKey.rawPubKey);

  /**
   * @notice Encrypts this command along with a signature to produce a Message.
   * To save gas, we can constrain the following values to 50 bits and pack
   * them into a 250-bit value:
   * 0. state index
   * 3. vote option index
   * 4. new vote weight
   * 5. nonce
   * 6. poll ID
   */
  encrypt = (signature: Signature, sharedKey: EcdhSharedKey): Message => {
    const plaintext = [...this.asArray(), BigInt(signature.R8[0]), BigInt(signature.R8[1]), BigInt(signature.S)];

    assert(plaintext.length === 7);

    const ciphertext: Ciphertext = poseidonEncrypt(plaintext, sharedKey, BigInt(0));

    const message = new Message(BigInt(1), ciphertext as bigint[]);

    return message;
  };

  /**
   * Decrypts a Message to produce a Command.
   * @param {Message} message - the message to decrypt
   * @param {EcdhSharedKey} sharedKey - the shared key to use for decryption
   */
  static decrypt = (message: Message, sharedKey: EcdhSharedKey): IDecryptMessage => {
    const decrypted = poseidonDecrypt(message.data, sharedKey, BigInt(0), 7);

    const p = BigInt(decrypted[0].toString());

    // Returns the value of the 50 bits at position `pos` in `val`
    // create 50 '1' bits
    // shift left by pos
    // AND with val
    // shift right by pos
    const extract = (val: bigint, pos: number): bigint =>
      // eslint-disable-next-line no-bitwise
      BigInt((((BigInt(1) << BigInt(50)) - BigInt(1)) << BigInt(pos)) & val) >> BigInt(pos);

    // p is a packed value
    // bits 0 - 50:    stateIndex
    // bits 51 - 100:  voteOptionIndex
    // bits 101 - 150: newVoteWeight
    // bits 151 - 200: nonce
    // bits 201 - 250: pollId
    const stateIndex = extract(p, 0);
    const voteOptionIndex = extract(p, 50);
    const newVoteWeight = extract(p, 100);
    const nonce = extract(p, 150);
    const pollId = extract(p, 200);

    const newPubKey = new PubKey([decrypted[1], decrypted[2]]);
    const salt = decrypted[3];

    const command = new PCommand(stateIndex, newPubKey, voteOptionIndex, newVoteWeight, nonce, pollId, salt);

    const signature = {
      R8: [decrypted[4], decrypted[5]] as Point,
      S: decrypted[6],
    };

    return { command, signature };
  };

  /**
   * Serialize into a JSON object
   */
  toJSON(): IJsonPCommand {
    return {
      stateIndex: this.stateIndex.toString(),
      newPubKey: this.newPubKey.serialize(),
      voteOptionIndex: this.voteOptionIndex.toString(),
      newVoteWeight: this.newVoteWeight.toString(),
      nonce: this.nonce.toString(),
      pollId: this.pollId.toString(),
      salt: this.salt.toString(),
      cmdType: this.cmdType.toString(),
    };
  }

  /**
   * Deserialize into a PCommand instance
   * @param json
   * @returns a PComamnd instance
   */
  static fromJSON(json: IJsonPCommand): PCommand {
    const command = new PCommand(
      BigInt(json.stateIndex),
      PubKey.deserialize(json.newPubKey),
      BigInt(json.voteOptionIndex),
      BigInt(json.newVoteWeight),
      BigInt(json.nonce),
      BigInt(json.pollId),
      BigInt(json.salt),
    );

    return command;
  }
}
