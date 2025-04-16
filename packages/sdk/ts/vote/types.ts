import type { IMessageContractParams, Keypair, Message, PrivateKey, PublicKey } from "@maci-protocol/domainobjs";
import type { Signer } from "ethers";

/**
 * Interface for the arguments for the generateVote function
 */
export interface IGenerateVoteArgs {
  /**
   * The poll id
   */
  pollId: bigint;

  /**
   * The index of the vote option
   */
  voteOptionIndex: bigint;

  /**
   * The salt for the vote
   */
  salt?: bigint;

  /**
   * The nonce for the vote
   */
  nonce: bigint;

  /**
   * The private key for the vote
   */
  privateKey: PrivateKey;

  /**
   * The state index for the vote
   */
  stateIndex: bigint;

  /**
   * The weight of the vote
   */
  voteWeight: bigint;

  /**
   * The coordinator public key
   */
  coordinatorPublicKey: PublicKey;

  /**
   * The largest vote option index
   */
  maxVoteOption: bigint;

  /**
   * Ephemeral keypair
   */
  ephemeralKeypair?: Keypair;

  /**
   * New key in case of key change message
   */
  newPublicKey?: PublicKey;
}

/**
 * Interface for the vote object
 */
export interface IVote {
  /**
   * The message to be sent to the contract
   */
  message: Message;

  /**
   * The ephemeral keypair used to generate the shared key for encrypting the message
   */
  ephemeralKeypair: Keypair;
}

/**
 * Interface for the submitVote function
 */
export interface ISubmitVoteArgs {
  /**
   * The address of the poll
   */
  pollAddress: string;

  /**
   * The vote to submit
   */
  vote: IVote;

  /**
   * The signer to use
   */
  signer: Signer;
}

/**
 * Interface for the submitVoteBatch function
 */
export interface ISubmitVoteBatchArgs {
  /**
   * The address of the poll
   */
  pollAddress: string;

  /**
   * The votes to submit
   * @note The messages must be in reverse order (by nonce) to be processed correctly
   */
  votes: IVote[];

  /**
   * The signer to use
   */
  signer: Signer;
}

/**
 * Interface for the arguments to the batch publish command
 */
export interface IPublishBatchArgs {
  /**
   * User messages
   */
  messages: IPublishMessage[];

  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The public key of the user
   */
  publicKey: string;

  /**
   * The private key of the user
   */
  privateKey: string;

  /**
   * A signer object
   */
  signer: Signer;
}

/**
 * Interface that represents user publish message
 */
export interface IPublishMessage {
  /**
   * The index of the state leaf
   */
  stateIndex: bigint;

  /**
   * The index of the vote option
   */
  voteOptionIndex: bigint;

  /**
   * The nonce of the message
   */
  nonce: bigint;

  /**
   * The new vote weight
   */
  newVoteWeight: bigint;

  /**
   * The salt of the message
   */
  salt?: bigint;
}

/**
 * Interface that represents publish batch return data
 */
export interface IPublishBatchData {
  /**
   * Publish transaction hash
   */
  hash: string;

  /**
   * Encrypted publish messages
   */
  encryptedMessages: IMessageContractParams[];

  /**
   * Encryption private keys
   */
  privateKeys: string[];
}

/**
 * Interface for the arguments to the publish command
 */
export interface IPublishArgs extends IPublishMessage {
  /**
   * The poll public key
   */
  publicKey: string;

  /**
   * The poll private key
   */
  privateKey: string;

  /**
   * The address of the MACI contract
   */
  maciAddress: string;

  /**
   * The id of the poll
   */
  pollId: bigint;

  /**
   * A signer object
   */
  signer: Signer;
}

/**
 * Interface that represents return data type for publish message
 */
export interface IPublishData {
  /**
   * The ephemeral private key used to encrypt the message
   */
  privateKey: string;

  /**
   * Encrypted publish message
   */
  encryptedMessage: IMessageContractParams;

  /**
   * Publish transaction hash
   */
  hash: string;
}

/**
 * Invalidate votes args
 */
export interface IInvalidateVotesArgs {
  /**
   * MACI contract address
   */
  maciAddress: string;

  /**
   * Poll id
   */
  pollId: bigint;

  /**
   * Signer
   */
  signer: Signer;

  /**
   * MACI private key
   */
  maciPrivateKey: PrivateKey;

  /**
   * State index
   */
  stateIndex: bigint;
}
