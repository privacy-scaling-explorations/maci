import {
  poseidonDecrypt,
  poseidonEncrypt,
  generateRandomSalt,
  hash4,
  sign,
  verifySignature,
  type Signature,
  type EcdhSharedKey,
  type Point,
  poseidonDecryptWithoutCheck,
} from "@maci-protocol/crypto";

import assert from "assert";

import type { IJsonPCommand } from "./types";
import type { PrivateKey } from "../privateKey";

import { Message } from "../message";
import { PublicKey } from "../publicKey";

export interface IDecryptMessage {
  command: VoteCommand;
  signature: Signature;
}

/**
 * @notice Unencrypted data whose fields include the user's public key, vote etc.
 * This represents a Vote command.
 */
export class VoteCommand {
  stateIndex: bigint;

  newPublicKey: PublicKey;

  voteOptionIndex: bigint;

  newVoteWeight: bigint;

  nonce: bigint;

  pollId: bigint;

  salt: bigint;

  /**
   * Create a new VoteCommand
   * @param stateIndex the state index of the user
   * @param newPublicKey the new public key of the user
   * @param voteOptionIndex the index of the vote option
   * @param newVoteWeight the new vote weight of the user
   * @param nonce the nonce of the message
   * @param pollId the poll ID
   * @param salt the salt of the message
   */
  constructor(
    stateIndex: bigint,
    newPublicKey: PublicKey,
    voteOptionIndex: bigint,
    newVoteWeight: bigint,
    nonce: bigint,
    pollId: bigint,
    salt: bigint = generateRandomSalt(),
  ) {
    const limit50Bits = BigInt(2 ** 50);
    assert(limit50Bits >= stateIndex);
    assert(limit50Bits >= voteOptionIndex);
    assert(limit50Bits >= newVoteWeight);
    assert(limit50Bits >= nonce);
    assert(limit50Bits >= pollId);

    this.stateIndex = stateIndex;
    this.newPublicKey = newPublicKey;
    this.voteOptionIndex = voteOptionIndex;
    this.newVoteWeight = newVoteWeight;
    this.nonce = nonce;
    this.pollId = pollId;
    this.salt = salt;
  }

  /**
   * Create a deep clone of this VoteCommand
   * @returns a copy of the VoteCommand
   */
  copy = <T extends VoteCommand>(): T =>
    new VoteCommand(
      BigInt(this.stateIndex.toString()),
      this.newPublicKey.copy(),
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

    const command = [params, ...this.newPublicKey.asArray(), this.salt];
    assert(command.length === 4);

    return command;
  };

  asCircuitInputs = (): bigint[] => this.asArray();

  /*
   * Check whether this command has deep equivalence to another command
   */
  equals = (command: VoteCommand): boolean =>
    this.stateIndex === command.stateIndex &&
    this.newPublicKey.equals(command.newPublicKey) &&
    this.voteOptionIndex === command.voteOptionIndex &&
    this.newVoteWeight === command.newVoteWeight &&
    this.nonce === command.nonce &&
    this.pollId === command.pollId &&
    this.salt === command.salt;

  hash = (): bigint => hash4(this.asArray());

  /**
   * @notice Signs this command and returns a Signature.
   */
  sign = (privateKey: PrivateKey): Signature => sign(privateKey.raw.toString(), this.hash());

  /**
   * @notice Returns true if the given signature is a correct signature of this
   * command and signed by the private key associated with the given public
   * key.
   */
  verifySignature = (signature: Signature, publicKey: PublicKey): boolean =>
    verifySignature(this.hash(), signature, publicKey.raw);

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

    const ciphertext = poseidonEncrypt(plaintext, sharedKey, BigInt(0));

    const message = new Message(ciphertext as bigint[]);

    return message;
  };

  /**
   * Decrypts a Message to produce a Command.
   * @dev You can force decrypt the message by setting `force` to true.
   * This is useful in case you don't want an invalid message to throw an error.
   * @param message - the message to decrypt
   * @param sharedKey - the shared key to use for decryption
   * @param force - whether to force decryption or not
   */
  static decrypt = (message: Message, sharedKey: EcdhSharedKey, force = false): IDecryptMessage => {
    const decrypted = force
      ? poseidonDecryptWithoutCheck(message.data, sharedKey, BigInt(0), 7)
      : poseidonDecrypt(message.data, sharedKey, BigInt(0), 7);

    const data = BigInt(decrypted[0].toString());

    // Returns the value of the 50 bits at position `pos` in `val`
    // create 50 '1' bits
    // shift left by pos
    // AND with val
    // shift right by pos
    const extract = (val: bigint, pos: number): bigint =>
      // eslint-disable-next-line no-bitwise
      BigInt((((BigInt(1) << BigInt(50)) - BigInt(1)) << BigInt(pos)) & val) >> BigInt(pos);

    // data is a packed value
    // bits 0 - 50:    stateIndex
    // bits 51 - 100:  voteOptionIndex
    // bits 101 - 150: newVoteWeight
    // bits 151 - 200: nonce
    // bits 201 - 250: pollId
    const stateIndex = extract(data, 0);
    const voteOptionIndex = extract(data, 50);
    const newVoteWeight = extract(data, 100);
    const nonce = extract(data, 150);
    const pollId = extract(data, 200);

    // create new public key but allow it to be invalid (as when passing an mismatched
    // encryptionPublicKey, a message will not decrypt resulting in potentially invalid public keys)
    const newPublicKey = new PublicKey([decrypted[1], decrypted[2]], true);
    const salt = decrypted[3];

    const command = new VoteCommand(stateIndex, newPublicKey, voteOptionIndex, newVoteWeight, nonce, pollId, salt);

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
      newPublicKey: this.newPublicKey.serialize(),
      voteOptionIndex: this.voteOptionIndex.toString(),
      newVoteWeight: this.newVoteWeight.toString(),
      nonce: this.nonce.toString(),
      pollId: this.pollId.toString(),
      salt: this.salt.toString(),
    };
  }

  /**
   * Deserialize into a VoteCommand instance
   * @param json
   * @returns a VoteCommand instance
   */
  static fromJSON(json: IJsonPCommand): VoteCommand {
    const command = new VoteCommand(
      BigInt(json.stateIndex),
      PublicKey.deserialize(json.newPublicKey),
      BigInt(json.voteOptionIndex),
      BigInt(json.newVoteWeight),
      BigInt(json.nonce),
      BigInt(json.pollId),
      BigInt(json.salt),
    );

    return command;
  }
}
