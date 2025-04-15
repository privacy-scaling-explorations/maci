/**
 * Interface for the arguments for generate keypair command
 */
export interface IGenerateKeypairArgs {
  /**
   * Seed value for keypair
   */
  seed?: bigint;
}

/**
 * Interface for the return data type for generate keypair command
 */
export interface IGenerateKeypairData {
  /**
   * Serialized public key
   */
  publicKey: string;

  /**
   * Serialized private key
   */
  privateKey: string;
}
