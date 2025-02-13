/**
 * Interface that represents public key return data
 */
export interface IGetPublicKeyData {
  /**
   * RSA public key
   */
  publicKey: string;
}

/**
 * Interface that represents private key return data
 */
export interface IGetPrivateKeyData {
  /**
   * RSA private key
   */
  privateKey: string;
}

/**
 * Interface that represents zkey file paths return data
 */
export interface IGetZkeyFilePathsData {
  /**
   * Zkey filepath
   */
  zkey: string;

  /**
   * Wasm filepath
   */
  wasm: string;

  /**
   * Witgen filepath
   */
  witgen: string;
}
