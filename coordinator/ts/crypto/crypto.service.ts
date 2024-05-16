import { Logger } from "@nestjs/common";

import { publicEncrypt, privateDecrypt, type KeyLike } from "crypto";

import { ErrorCodes } from "../common";

/**
 * CryptoService is responsible for encrypting and decrypting user sensitive data
 */
export class CryptoService {
  /**
   * Singleton instance
   */
  private static INSTANCE?: CryptoService;

  /**
   * Logger
   */
  private readonly logger: Logger;

  /**
   * Empty constructor
   */
  private constructor() {
    this.logger = new Logger(CryptoService.name);
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
    try {
      const encrypted = publicEncrypt(publicKey, Buffer.from(value));

      return encrypted.toString("base64");
    } catch (error) {
      this.logger.error(`Error: ${ErrorCodes.ENCRYPTION}`, error);
      throw new Error(ErrorCodes.ENCRYPTION);
    }
  }

  /**
   * Decrypt ciphertext with private key
   *
   * @param privateKey - private key
   * @param value - ciphertext
   * @returns plaintext
   */
  decrypt(privateKey: KeyLike, value: string): string {
    try {
      const decryptedData = privateDecrypt(privateKey, Buffer.from(value, "base64"));

      return decryptedData.toString();
    } catch (error) {
      this.logger.error(`Error: ${ErrorCodes.DECRYPTION}`, error);
      throw new Error(ErrorCodes.DECRYPTION);
    }
  }
}
