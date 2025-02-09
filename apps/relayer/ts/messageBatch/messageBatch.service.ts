import { Injectable, Logger } from "@nestjs/common";
import { validate } from "class-validator";
import flatten from "lodash/flatten.js";
import uniqBy from "lodash/uniqBy.js";
import { PubKey } from "maci-domainobjs";
import { getDefaultSigner, MACI__factory as MACIFactory, Poll__factory as PollFactory } from "maci-sdk";

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
  ) {}

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
      ...message,
      publicKey: PubKey.deserialize(message.publicKey).asArray(),
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

    const signer = await getDefaultSigner();
    const maciContract = MACIFactory.connect(maciAddress, signer);
    const pollAddresses = await maciContract.polls(pollId);
    const pollContract = PollFactory.connect(pollAddresses.poll, signer);

    const messageHashes = await Promise.all(
      allMessages.map(({ data, publicKey }) =>
        pollContract.hashMessageAndEncPubKey({ data }, { x: publicKey[0], y: publicKey[1] }),
      ),
    );

    await pollContract.relayMessagesBatch(messageHashes, ipfsHash).then((tx) => tx.wait());

    return messageBatches;
  }
}
