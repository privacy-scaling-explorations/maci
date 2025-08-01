import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, RootFilterQuery } from "mongoose";

import type { ICreateMessages } from "./types.js";

import { Message, MESSAGES_LIMIT } from "./message.schema.js";

/**
 * Message repository is used to interact with the message collection
 */
@Injectable()
export class MessageRepository {
  /**
   * Logger
   */
  private readonly logger: Logger = new Logger(MessageRepository.name);

  /**
   * Initializes the message repository
   *
   * @param MessageModel message model
   */
  constructor(@InjectModel(Message.name) private MessageModel: Model<Message>) {}

  /**
   * Create messages from dto
   *
   * @param dto publish messages dto
   * @returns inserted messages
   */
  async create(dto: ICreateMessages): Promise<Message[]> {
    const messages = dto.messages.map(({ data, publicKey, hash }) => ({
      data,
      publicKey,
      maciContractAddress: dto.maciContractAddress,
      hash,
      poll: dto.poll,
    }));

    return this.MessageModel.insertMany(messages).catch((error) => {
      this.logger.error(`Create messages error:`, error);
      throw error;
    });
  }

  /**
   * Find messages with filter query
   *
   * @param filter filter query
   * @returns messages
   */
  async find(
    filter: RootFilterQuery<Message>,
    { limit = MESSAGES_LIMIT, skip = 0 }: Partial<{ limit: number; skip: number }> = {},
  ): Promise<Message[]> {
    return this.MessageModel.find(filter)
      .limit(limit)
      .skip(skip)
      .exec()
      .catch((error) => {
        this.logger.error(`Find messages error:`, error);
        throw error;
      });
  }
}
