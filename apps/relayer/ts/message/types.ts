/**
 * Interface for saving messages
 */
export interface ICreateMessages {
  /**
   * Messages
   */
  messages: ICreateMessageWithHash[];

  /**
   * MACI contract address
   */
  maciContractAddress: string;

  /**
   * Poll id
   */
  poll: number;
}

/**
 * Interface for saved messages
 */
export interface ICreateMessageWithHash {
  /**
   * Message data
   */
  data: string[];

  /**
   * Public key
   */
  publicKey: string;

  /**
   * Message hash
   */
  hash: string;
}
