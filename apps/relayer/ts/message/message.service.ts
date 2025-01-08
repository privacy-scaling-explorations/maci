import { Injectable, Logger } from "@nestjs/common";

import type { PublishMessagesDto } from "./dto";
import type { IPublishMessagesReturn } from "./types";

/**
 * MessageService is responsible for saving message batches and send them onchain
 */
@Injectable()
export class MessageService {
  /**
   * Logger
   */
  private readonly logger: Logger = new Logger(MessageService.name);

  /**
   * Save messages batch
   *
   * @param args - publish messages dto
   * @returns success or not
   */
  async saveMessages(args: PublishMessagesDto): Promise<boolean> {
    this.logger.log("Save messages", args);
    return Promise.resolve(true);
  }

  /**
   * Publish messages onchain
   *
   * @param args - publish messages dto
   * @returns transaction and ipfs hashes
   */
  async publishMessages(args: PublishMessagesDto): Promise<IPublishMessagesReturn> {
    this.logger.log("Publish messages", args);
    return Promise.resolve({ hash: "", ipfsHash: "" });
  }
}
