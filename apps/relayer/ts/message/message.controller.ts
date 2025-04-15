/* eslint-disable @typescript-eslint/no-shadow */
import { Body, Controller, HttpException, HttpStatus, Logger, Post, UseGuards } from "@nestjs/common";
import { ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

import { PublishMessagesDto } from "./message.dto.js";
import { MessageGuard } from "./message.guard.js";
import { Message } from "./message.schema.js";
import { MessageService } from "./message.service.js";

@ApiTags("v1/messages")
@Controller("v1/messages")
@UseGuards(MessageGuard)
export class MessageController {
  /**
   * Logger
   */
  private readonly logger = new Logger(MessageController.name);

  /**
   * Initialize MessageController
   *
   * @param messageService message service
   */
  constructor(private readonly messageService: MessageService) {}

  /**
   * Publish user messages api method.
   * Saves messages batch and then send them onchain by calling `publishMessages` method via cron job.
   *
   * @param args publish messages dto
   * @returns success or not
   */
  @ApiBody({ type: PublishMessagesDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The messages have been successfully accepted" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Post("publish")
  async publish(@Body() args: PublishMessagesDto): Promise<Message[]> {
    return this.messageService.saveMessages(args).catch((error: Error) => {
      this.logger.error(`Error:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }
}
