import { Injectable, Logger } from "@nestjs/common";
import { validate } from "class-validator";

import type { MessageBatchDto } from "./dto";

import { IpfsService } from "../ipfs/ipfs.service";

import { MessageBatchRepository } from "./messageBatch.repository";
import { MessageBatch } from "./messageBatch.schema";

/**
 * MessageBatchService is responsible for saving message batches and send them to ipfs
 */
@Injectable()
export class MessageBatchService {
  /**
   * Logger
   */
  private readonly logger: Logger = new Logger(MessageBatchService.name);

  /**
   * Initialize MessageBatchService
   *
   * @param ipfsService ipfs service
   * @param messageBatchRepository message batch repository
   */
  constructor(
    private readonly ipfsService: IpfsService,
    private readonly messageBatchRepository: MessageBatchRepository,
  ) {}

  /**
   * Save messages batch
   *
   * @param args publish messages dto
   * @returns success or not
   */
  async saveMessageBatches(args: Omit<MessageBatchDto, "ipfsHash">[]): Promise<MessageBatch[]> {
    const validationErrors = await Promise.all(args.map((values) => validate(values))).then((result) =>
      result.reduce((acc, errors) => {
        acc.push(...errors);
        return acc;
      }, []),
    );

    if (validationErrors.length > 0) {
      this.logger.error(`Validation error:`, validationErrors);

      throw new Error("Validation error");
    }

    const ipfsHash = await this.ipfsService.add(args.map(({ messages }) => messages)).catch((error) => {
      this.logger.error(`Upload message batches to ipfs error:`, error);
      throw error;
    });

    return this.messageBatchRepository.create(args.map(({ messages }) => ({ messages, ipfsHash }))).catch((error) => {
      this.logger.error(`Save message batch error:`, error);
      throw error;
    });
  }
}
