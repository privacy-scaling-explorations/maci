import {
  Logger,
  type CanActivate,
  Injectable,
  SetMetadata,
  type ExecutionContext,
  type CustomDecorator,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ethers } from "ethers";

import fs from "fs";
import path from "path";

import type { Request as Req } from "express";
import type { Socket } from "socket.io";

import { CryptoService } from "../crypto/crypto.service";

/**
 * Public metadata key
 */
export const PUBLIC_METADATA_KEY = "isPublic";

/**
 * Public decorator to by-pass auth checks
 *
 * @returns public decorator
 */
export const Public = (): CustomDecorator => SetMetadata(PUBLIC_METADATA_KEY, true);

/**
 * AccountSignatureGuard is responsible for protecting calling controller and websocket gateway functions.
 * If account address is not added to .env file, you will not be allowed to call any API methods.
 * Make sure you send `Authorization: Bearer encrypt({signature}:{digest})` header where:
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
   * Logger
   */
  private readonly logger: Logger;

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly reflector: Reflector,
  ) {
    this.logger = new Logger(AccountSignatureGuard.name);
  }

  /**
   * This function should return a boolean, indicating  whether the request is allowed or not based on message signature and digest.
   *
   * @param ctx - execution context
   * @returns whether the request is allowed or not
   */
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    try {
      const isPublic = this.reflector.get<boolean>(PUBLIC_METADATA_KEY, ctx.getHandler());

      if (isPublic) {
        return true;
      }

      const request = ctx.switchToHttp().getRequest<Partial<Req>>();
      const socket = ctx.switchToWs().getClient<Partial<Socket>>();
      const encryptedHeader = socket.handshake?.headers.authorization || request.headers?.authorization;

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
      const coordinatorAddress =
        process.env.COORDINATOR_ADDRESSES?.split(",").map((value) => value.toLowerCase()) ?? [];

      return coordinatorAddress.includes(address);
    } catch (error) {
      this.logger.error("Error", error);
      return false;
    }
  }
}
