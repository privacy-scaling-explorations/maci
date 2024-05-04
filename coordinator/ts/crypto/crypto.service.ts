import { publicEncrypt, privateDecrypt, type KeyLike } from "crypto";

/**
 * CryptoService is responsible for encrypting and decrypting user sensitive data
 */
export class CryptoService {
  /**
   * Singleton instance
   */
  private static INSTANCE?: CryptoService;

  /**
   * Empty constructor
   */
  private constructor() {
    // use singleton initialization
  }

  /**
   * Get singleton crypto service instance
   *
   * @returns crypto service instance
   */
  static getInstance(): CryptoService {
    if (!CryptoService.INSTANCE) {
      CryptoService.INSTANCE = new CryptoService();
    }

    return CryptoService.INSTANCE;
  }

  /**
   * Encrypt plaintext with public key
   *
   * @param publicKey - public key
   * @param value - plaintext
   * @returns ciphertext
   */
  encrypt(publicKey: KeyLike, value: string): string {
    const encrypted = publicEncrypt(publicKey, Buffer.from(value));

    return encrypted.toString("base64");
  }

  /**
   * Decrypt ciphertext with private key
   *
   * @param privateKey - private key
   * @param value - ciphertext
   * @returns plaintext
   */
  decrypt(privateKey: KeyLike, value: string): string {
    const decryptedData = privateDecrypt(privateKey, Buffer.from(value, "base64"));

    return decryptedData.toString();
  }
}
