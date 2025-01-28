import { Injectable, Logger } from "@nestjs/common";
import { validate } from "class-validator";
import flatten from "lodash/flatten";
import uniqBy from "lodash/uniqBy";
import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "maci-contracts";
import { PubKey } from "maci-domainobjs";

import type { MessageBatchDto } from "./messageBatch.dto";

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

    const allMessages = flatten(args.map((item) => item.messages));

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

    const maciContract = MACIFactory.connect(maciAddress);
    const pollAddresses = await maciContract.polls(pollId);
    const pollContract = PollFactory.connect(pollAddresses.poll);

    const messageHashes = await Promise.all(
      allMessages.map(({ data, publicKey }) =>
        pollContract.hashMessageAndEncPubKey({ data }, PubKey.deserialize(publicKey).asContractParam()),
      ),
    );

    await pollContract.relayMessagesBatch(messageHashes, ipfsHash).then((tx) => tx.wait());

    return messageBatches;
  }
}
