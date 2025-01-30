/* eslint-disable @typescript-eslint/no-shadow */
import { Body, Controller, Get, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import set from "lodash/set";

import { GetMessageBatchesDto } from "./messageBatch.dto";
import { MessageBatch } from "./messageBatch.schema";
import { MessageBatchService } from "./messageBatch.service";

@ApiTags("v1/messageBatches")
@Controller("v1/messageBatches")
export class MessageBatchController {
  /**
   * Logger
   */
  private readonly logger = new Logger(MessageBatchController.name);

  /**
   * Initialize MessageBatchController
   *
   * @param messageBatchService message batch service
   */
  constructor(private readonly messageBatchService: MessageBatchService) {}

  /**
   * Fetch message batches api method.
   *
   * @param args fetch arguments
   * @returns message batches
   */
  @ApiBody({ type: GetMessageBatchesDto })
  @ApiResponse({ status: HttpStatus.OK, description: "The message batches have been successfully returned" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Get("get")
  async get(@Body() args: GetMessageBatchesDto): Promise<MessageBatch[]> {
    const { ipfsHashes, poll, maciContractAddress, publicKey, limit } = args;

    const filter = {
      poll: { $eq: poll },
      maciContractAddress: { $eq: maciContractAddress },
    };

    if (ipfsHashes) {
      set(filter, "ipfsHash.$in", ipfsHashes);
    }

    if (publicKey) {
      set(filter, "messages.$elemMatch.publicKey.$eq", publicKey);
    }

    return this.messageBatchService.findMessageBatches(filter, limit).catch((error: Error) => {
      this.logger.error(`Error:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }
}
