import { Logger, CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
import { ethers } from "ethers";

import fs from "fs";
import path from "path";

import type { Request as Req } from "express";

import { CryptoService } from "../crypto/crypto.service";

/**
 * AccountSignatureGuard is responsible for protecting calling controller functions.
 * If account address is not added to .env file, you will not be allowed to call any API methods.
 * Make sure you send `Authorization encrypt({signature}:{digest})` header where:
 * 1. encrypt - RSA public encryption.
 * 2. signature - eth wallet signature for any message
 * 3. digest - hex representation of message digest
 *
 * ```
 * const signature = await signer.signMessage("message");
 * const digest = Buffer.from(getBytes(hashMessage("message"))).toString("hex");
 * ```
 * See tests for more details about authorization.
 */
@Injectable()
export class AccountSignatureGuard implements CanActivate {
  /**
   * Crypto service
   */
  private readonly cryptoService = CryptoService.getInstance();

  /**
   * Logger
   */
  private readonly logger = new Logger(AccountSignatureGuard.name);

  /**
   * This function should return a boolean, indicating  whether the request is allowed or not based on message signature and digest.
   *
   * @param ctx - execution context
   * @returns whether the request is allowed or not
   */
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    try {
      const request = ctx.switchToHttp().getRequest<Req>();
      const encryptedHeader = request.headers.authorization;

      if (!encryptedHeader) {
        this.logger.warn("No authorization header");
        return false;
      }

      const privateKey = await fs.promises.readFile(path.resolve(process.env.COORDINATOR_PRIVATE_KEY_PATH!));
      const [signature, digest] = this.cryptoService
        .decrypt(privateKey, encryptedHeader.replace("Bearer", "").trim())
        .split(":");

      if (!signature || !digest) {
        this.logger.warn("No signature or digest");
        return false;
      }

      const address = ethers.recoverAddress(Buffer.from(digest, "hex"), signature).toLowerCase();
      const coordinatorAddress = process.env.COORDINATOR_ADDRESS?.toLowerCase();

      return address === coordinatorAddress;
    } catch (error) {
      this.logger.error("Error", error);
      return false;
    }
  }
}
