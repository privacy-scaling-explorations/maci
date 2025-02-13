import { Injectable, Logger } from "@nestjs/common";

import { publicEncrypt, privateDecrypt, type KeyLike } from "crypto";

import { ErrorCodes } from "../common";

/**
 * CryptoService is responsible for encrypting and decrypting user sensitive data
 */
@Injectable()
export class CryptoService {
  /**
   * Logger
   */
  private readonly logger: Logger;

  /**
   * Initialize service
   */
  constructor() {
    this.logger = new Logger(CryptoService.name);
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
      throw new Error(ErrorCodes.ENCRYPTION.toString());
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
      throw new Error(ErrorCodes.DECRYPTION.toString());
    }
  }
}
