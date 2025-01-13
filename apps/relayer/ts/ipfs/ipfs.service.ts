import { Injectable, Logger } from "@nestjs/common";

import type { JSON as JsonAdapter } from "@helia/json";

/**
 * IpfsService is responsible for saving data to ipfs
 */
@Injectable()
export class IpfsService {
  /**
   * Logger
   */
  private readonly logger: Logger = new Logger(IpfsService.name);

  /**
   * IPFS adapter
   */
  private adapter?: JsonAdapter;

  /**
   * Initialize IpfsService
   */
  async init(): Promise<void> {
    if (!this.adapter) {
      const { createHelia } = await import("helia");
      const { json } = await import("@helia/json");

      const helia = await createHelia();
      this.adapter = json(helia);
    }
  }

  /**
   * Add data to IPFS and return the CID
   *
   * @param data data to be added to IPFS
   * @returns cid
   */
  async add<T>(data: T): Promise<string> {
    this.checkAdapter();

    return this.adapter!.add(data).then((cid) => cid.toString());
  }

  /**
   * Get data from IPFS
   *
   * @param cid CID of the data to be fetched from IPFS
   * @returns data
   */
  async get<T>(cid: string): Promise<T> {
    this.checkAdapter();

    const { CID } = await import("multiformats");

    return this.adapter!.get<T>(CID.parse(cid));
  }

  /**
   * Check if IPFS adapter is initialized
   *
   * @throws Error if IPFS adapter is not initialized
   */
  private checkAdapter(): void {
    if (!this.adapter) {
      this.logger.error("IPFS adapter is not initialized");
      throw new Error("IPFS adapter is not initialized");
    }
  }
}
