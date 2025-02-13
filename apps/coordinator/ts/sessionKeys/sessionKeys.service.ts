import { Injectable, Logger } from "@nestjs/common";
import { deserializePermissionAccount } from "@zerodev/permissions";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { createKernelAccountClient, KernelAccountClient, KernelSmartAccount } from "@zerodev/sdk";
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types";
import { http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import type { Chain, Hex, HttpTransport, Transport } from "viem";

import { ErrorCodes, ESupportedNetworks } from "../common";
import { getPublicClient, getZeroDevBundlerRPCUrl } from "../common/accountAbstraction";
import { viemChain } from "../common/networks";
import { FileService } from "../file/file.service";

import { IGenerateSessionKeyReturn } from "./types";

/**
 * SessionKeysService is responsible for generating and managing session keys.
 */
@Injectable()
export class SessionKeysService {
  /**
   * Logger
   */
  private readonly logger: Logger;

  /**
   * Create a new instance of SessionKeysService
   *
   * @param fileService - file service
   */
  constructor(private readonly fileService: FileService) {
    this.logger = new Logger(SessionKeysService.name);
  }

  /**
   * Generate a session key
   *
   * @returns session key address
   */
  generateSessionKey(): IGenerateSessionKeyReturn {
    const sessionPrivateKey = generatePrivateKey();

    const sessionKeySigner = toECDSASigner({
      signer: privateKeyToAccount(sessionPrivateKey),
    });

    const sessionKeyAddress = sessionKeySigner.account.address;

    // save the key
    this.fileService.storeSessionKey(sessionPrivateKey, sessionKeyAddress);

    return {
      sessionKeyAddress,
    };
  }

  /**
   * Generate a KernelClient from a session key and an approval
   *
   * @param sessionKeyAddress - the address of the session key
   * @param approval - the approval string
   * @param chain - the chain to use
   * @returns a KernelAccountClient
   */
  async generateClientFromSessionKey(
    sessionKeyAddress: Hex,
    approval: string,
    chain: ESupportedNetworks,
  ): Promise<
    KernelAccountClient<
      ENTRYPOINT_ADDRESS_V07_TYPE,
      Transport,
      Chain,
      KernelSmartAccount<ENTRYPOINT_ADDRESS_V07_TYPE, HttpTransport, Chain>
    >
  > {
    // retrieve the session key from the file service
    const sessionKey = this.fileService.getSessionKey(sessionKeyAddress);

    if (!sessionKey) {
      this.logger.error(`Session key not found: ${sessionKeyAddress}`);
      throw new Error(ErrorCodes.SESSION_KEY_NOT_FOUND.toString());
    }

    // create a public client
    const publicClient = getPublicClient(chain);

    // Using a stored private key
    const sessionKeySigner = toECDSASigner({
      signer: privateKeyToAccount(sessionKey),
    });

    try {
      // deserialize the permission account using approval and session key
      const sessionKeyAccount = await deserializePermissionAccount(
        publicClient,
        ENTRYPOINT_ADDRESS_V07,
        KERNEL_V3_1,
        approval,
        sessionKeySigner,
      );

      return createKernelAccountClient({
        bundlerTransport: http(getZeroDevBundlerRPCUrl(chain)),
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        account: sessionKeyAccount,
        chain: viemChain(chain),
      });
    } catch (error) {
      this.logger.error(`Error: ${ErrorCodes.INVALID_APPROVAL}`, error);
      throw new Error(ErrorCodes.INVALID_APPROVAL.toString());
    }
  }

  /**
   * Deactivate a session key
   *
   * @param sessionKeyAddress - key address
   */
  deactivateSessionKey(sessionKeyAddress: Hex): void {
    this.fileService.deleteSessionKey(sessionKeyAddress);
  }
}
