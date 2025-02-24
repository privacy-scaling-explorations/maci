import type { Signer } from "ethers";
import type { Keypair, Message, PrivKey, PubKey } from "maci-domainobjs";

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
  privateKey: PrivKey;
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
  coordinatorPubKey: PubKey;
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
  newPubKey?: PubKey;
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
