import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, RootFilterQuery } from "mongoose";

import { MessageBatchDto } from "./messageBatch.dto";
import { MESSAGE_BATCHES_LIMIT, MessageBatch } from "./messageBatch.schema";

/**
 * Message batch repository is used to interact with the message batch collection
 */
@Injectable()
export class MessageBatchRepository {
  /**
   * Logger
   */
  private readonly logger: Logger = new Logger(MessageBatchRepository.name);

  /**
   * Initializes the message batch repository
   *
   * @param MessageBatchModel message batch model
   */
  constructor(@InjectModel(MessageBatch.name) private MessageBatchModel: Model<MessageBatch>) {}

  /**
   * Create message batch from messages and ipfs hash
   *
   * @param messages messages
   * @param ipfsHash ipfs hash
   * @returns inserted message batch
   */
  async create(dto: MessageBatchDto[]): Promise<MessageBatch[]> {
    return this.MessageBatchModel.insertMany(dto).catch((error) => {
      this.logger.error(`Create message batch error:`, error);
      throw error;
    });
  }

  /**
   * Find message batches with filter query
   *
   * @param filter filter query
   * @returns message batches
   */
  async find(filter: RootFilterQuery<MessageBatch>, limit = MESSAGE_BATCHES_LIMIT): Promise<MessageBatch[]> {
    return this.MessageBatchModel.find(filter)
      .limit(limit)
      .exec()
      .catch((error) => {
        this.logger.error(`Find message batches error:`, error);
        throw error;
      });
  }
}
