import { Injectable, Logger } from "@nestjs/common";

import type { PublishMessagesDto } from "./dto";
import type { IPublishMessagesReturn } from "./types";

import { MessageBatchService } from "../messageBatch/messageBatch.service";

import { MessageRepository } from "./message.repository";
import { Message } from "./message.schema";

/**
 * MessageService is responsible for saving messages and send them onchain
 */
@Injectable()
export class MessageService {
  /**
   * Logger
   */
  private readonly logger: Logger = new Logger(MessageService.name);

  /**
   * Initialize MessageService
   *
   * @param messageBatchService message batch service
   * @param messageRepository message repository
   */
  constructor(
    private readonly messageBatchService: MessageBatchService,
    private readonly messageRepository: MessageRepository,
  ) {}

  /**
   * Save messages
   *
   * @param args publish messages dto
   * @returns success or not
   */
  async saveMessages(args: PublishMessagesDto): Promise<Message[]> {
    return this.messageRepository.create(args).catch((error) => {
      this.logger.error(`Save messages error:`, error);
      throw error;
    });
  }

  /**
   * Publish messages onchain
   *
   * @param args publish messages dto
   * @returns transaction and ipfs hashes
   */
  async publishMessages(): Promise<IPublishMessagesReturn> {
    const messages = await this.messageRepository.find({ messageBatch: { $exists: false } });

    await this.messageBatchService.saveMessageBatches([{ messages, ipfsHash: "" }]).catch((error) => {
      this.logger.error(`Save message batch error:`, error);
      throw error;
    });

    return Promise.resolve({ hash: "", ipfsHash: "" });
  }
}
