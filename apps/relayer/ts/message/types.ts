/**
 * Publish messages return type
 */
export interface IPublishMessagesReturn {
  /**
   * Transaction hash
   */
  hash: string;
  /**
   * IPFS hash for messages batch
   */
  ipfsHash: string;
}
