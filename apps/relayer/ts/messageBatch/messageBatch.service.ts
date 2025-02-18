import { Injectable, Logger } from "@nestjs/common";
import { validate } from "class-validator";
import flatten from "lodash/flatten.js";
import uniqBy from "lodash/uniqBy.js";
import { PubKey } from "maci-domainobjs";

import type { MessageBatch } from "./messageBatch.schema.js";
import type { RootFilterQuery } from "mongoose";

import { IpfsService } from "../ipfs/ipfs.service.js";

import { MAX_MESSAGES, type MessageBatchDto } from "./messageBatch.dto.js";
import { MessageBatchRepository } from "./messageBatch.repository.js";

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
  ) {
    ipfsService.init();
  }

  /**
   * Find message batches
   *
   * @param filter filter query
   * @param limit limit
   */
  async findMessageBatches(
    filter: RootFilterQuery<MessageBatch>,
    { limit = MAX_MESSAGES, skip = 0 }: Partial<{ limit: number; skip: number }> = {},
  ): Promise<MessageBatch[]> {
    return this.messageBatchRepository.find(filter, { limit, skip }).catch((error) => {
      this.logger.error(`Find message batches error:`, error);
      throw error;
    });
  }

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

    const allMessages = flatten(args.map((item) => item.messages)).map((message) => ({
      poll: message.poll,
      data: message.data,
      hash: message.hash,
      maciContractAddress: message.maciContractAddress,
      publicKey: PubKey.deserialize(message.publicKey).asArray().map(String),
    }));

    const ipfsHash = await this.ipfsService.add(allMessages).catch((error) => {
      this.logger.error(`Upload message batches to ipfs error:`, error);
      throw error;
    });

    const messageBatches = await this.messageBatchRepository
      .create(args.map(({ messages }) => ({ messages, ipfsHash })))
      .catch((error) => {
        this.logger.error(`Save message batch error:`, error);
        throw error;
      });

    const [{ maciAddress, pollId }] = uniqBy(
      allMessages.map(({ maciContractAddress, poll }) => ({
        maciAddress: maciContractAddress,
        pollId: poll,
      })),
      "maciContractAddress",
    );

    const { getDefaultSigner, relayMessages } = await import("maci-sdk");
    const signer = await getDefaultSigner();

    const bytes32IpfsHash = await this.ipfsService.cidToBytes32(ipfsHash);
    await relayMessages({ maciAddress, pollId, ipfsHash: bytes32IpfsHash, messages: allMessages, signer });

    return messageBatches;
  }
}
