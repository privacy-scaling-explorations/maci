import type { IIpfsMessage } from "@maci-protocol/contracts";
import type { Poll } from "@maci-protocol/contracts/typechain-types";
import type { Provider, Signer } from "ethers";

/**
 * Interface that represents get relayed messages arguments
 */
export interface IGetRelayedMessagesArgs {
  /**
   * MACI contract address
   */
  maciAddress: string;

  /**
   * Poll id
   */
  pollId: number;

  /**
   * Signer
   */
  signer: Signer;

  /**
   * Provider
   */
  provider: Provider;

  /**
   * Start block
   */
  startBlock?: number;

  /**
   * User public keys (optional)
   */
  publicKeys?: string[];

  /**
   * Message hashes (optional)
   */
  messageHashes?: string[];
}

/**
 * Interface that represents get message batches arguments
 */
export interface IGetMessageBatchesArgs {
  /**
   * Relayer service url
   */
  url: string;

  /**
   * Limit
   */
  limit: number;

  /**
   * Skip
   */
  skip: number;

  /**
   * Poll id
   */
  poll: number;

  /**
   * MACI contract address
   */
  maciContractAddress: string;

  /**
   * IPFS hashes of message batches (optional)
   */
  ipfsHashes?: string[];

  /**
   * User public keys (optional)
   */
  publicKeys?: string[];

  /**
   * Message hashes (optional)
   */
  messageHashes?: string[];
}

/**
 * Interface for the arguments for IpfsHashAdded events parsing
 */
export interface IParseIpfsHashAddedEventsArgs {
  /**
   * Poll contract
   */
  pollContract: Poll;

  /**
   * Start block
   */
  startBlock: number;

  /**
   * Provider
   */
  provider: Provider;

  /**
   * User public keys (optional)
   */
  publicKeys?: string[];

  /**
   * Message hashes (optional)
   */
  messageHashes?: string[];
}

/**
 * Interface for the return type for getting relayed messages
 */
export interface IGetRelayedMessagesData {
  /**
   * Uploaded IPFS messages
   */
  messages: IIpfsMessage[];
}

/**
 * Interface for the return type for getting message batches from relayer service
 */
export interface IGetMessageBatchesData {
  /**
   * Relayer message batches
   */
  messageBatches: IMessageBatch[];
}

/**
 * Interface that represents message batch
 */
export interface IMessageBatch {
  /**
   * Messages
   */
  messages: IIpfsMessage[];

  /**
   * IPFS hash
   */
  ipfsHash?: string;
}

/**
 * Interface that represents relay messages arguments
 */
export interface IRelayMessagesArgs {
  /**
   * Poll id
   */
  pollId: number;

  /**
   * MACI contract address
   */
  maciAddress: string;

  /**
   * IPFS hash
   */
  ipfsHash: string;

  /**
   * IPFS Messages
   */
  messages: IIpfsMessage[];

  /**
   * Signer
   */
  signer?: Signer;

  /**
   * Provider
   */
  provider?: Provider;
}

/**
 * Interface that represents return data for relay messages
 */
export interface IRelayMessagesData {
  /**
   * Transaction hash
   */
  hash?: string;
}
