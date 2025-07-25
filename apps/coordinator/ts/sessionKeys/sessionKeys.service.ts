import { Injectable, Logger } from "@nestjs/common";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { BrowserProvider, Signer } from "ethers";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import type { AASigner } from "@maci-protocol/contracts";
import type { Hex } from "viem";

import { ErrorCodes, ESupportedNetworks, getSigner, KernelClientType } from "../common";
import { getKernelClient } from "../common/accountAbstraction";
import { FileService } from "../file/file.service";

import { KernelEIP1193Provider } from "./provider/KernelEIP1193Provider";
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
  async generateSessionKey(): Promise<IGenerateSessionKeyReturn> {
    const sessionPrivateKey = generatePrivateKey();

    const sessionKeySigner = await toECDSASigner({
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
  ): Promise<KernelClientType> {
    // retrieve the session key from the file service
    const sessionKey = this.fileService.getSessionKey(sessionKeyAddress);

    if (!sessionKey) {
      this.logger.error(`Session key not found: ${sessionKeyAddress}`);
      throw new Error(ErrorCodes.SESSION_KEY_NOT_FOUND.toString());
    }

    try {
      const kernelClient = getKernelClient(sessionKey, approval, chain);
      return kernelClient;
    } catch (error) {
      this.logger.error("Error:", error);
      throw new Error(ErrorCodes.INVALID_APPROVAL.toString());
    }
  }

  /**
   * Get a signer from a kernel client (that could be generated from a session key)
   *
   * @param kernelClient - kernel client
   * @returns signer
   */
  async getKernelClientSigner(kernelClient: KernelClientType): Promise<AASigner> {
    const kernelProvider = new KernelEIP1193Provider(kernelClient);
    const ethersProvider = new BrowserProvider(kernelProvider);
    const signer = await ethersProvider.getSigner();
    const aaSigner: AASigner = signer;
    aaSigner.isAA = true;

    return aaSigner;
  }

  /**
   * Get a signer that would execute all the contract interactions in the coordinator service.
   * There are particular cases where the AA signer does not work so we default to the normal signer.
   * (e.g. `deployPoll`)
   * @param chain - the chain to use
   * @param sessionKeyAddress - the address of the session key. Defaults to normal signer if not provided
   * @param approval - the approval string. Defaults to normal signer if not provided
   * @returns a signer
   */
  async getCoordinatorSigner(
    chain: ESupportedNetworks,
    sessionKeyAddress?: Hex,
    approval?: string,
  ): Promise<AASigner | Signer> {
    if (sessionKeyAddress && approval) {
      const kernelClient = await this.generateClientFromSessionKey(sessionKeyAddress, approval, chain);
      return this.getKernelClientSigner(kernelClient);
    }

    return getSigner(chain);
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
