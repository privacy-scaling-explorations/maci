import { Body, Controller, HttpException, HttpStatus, Logger, Post } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import type { IIsPollScheduledResponse, ISchedulePollWithSignerArgs } from "./types";
import type { IIdentityScheduledPoll } from "../redis/types";

import { IdentityScheduledPollDto, SchedulePollWithSignerDto } from "./dto";
import { SchedulerService } from "./scheduler.service";

@ApiTags("v1/scheduler")
@Controller("v1/scheduler")
export class SchedulerController {
  /**
   * Logger
   */
  private readonly logger = new Logger(SchedulerController.name);

  /**
   * Initialize SchedulerController
   *
   * @param schedulerService - scheduler service
   */
  constructor(private readonly schedulerService: SchedulerService) {}

  /**
   * Register poll for finalization
   */
  @ApiResponse({ status: HttpStatus.OK, description: "Poll finalization has been scheduled" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Post("register")
  async register(@Body() args: SchedulePollWithSignerDto): Promise<IIsPollScheduledResponse> {
    const schedulePollWithSignerArgs: ISchedulePollWithSignerArgs = {
      ...args,
      pollId: args.pollId.toString(),
      endDate: 0,
      merged: false,
      proofsGenerated: false,
    };

    return this.schedulerService.registerPoll(schedulePollWithSignerArgs).catch((error: Error) => {
      this.logger.error(`Error:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }

  /**
   * Check if poll is scheduled for finalization
   * @param args - poll id to check
   * @returns true if poll is scheduled, false otherwise
   */
  @ApiResponse({ status: HttpStatus.OK, description: "Poll finalization status" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "BadRequest" })
  @Post("status")
  async status(@Body() args: IdentityScheduledPollDto): Promise<IIsPollScheduledResponse> {
    const identityScheduledPoll: IIdentityScheduledPoll = {
      ...args,
      pollId: args.pollId.toString(),
    };

    return this.schedulerService.isPollScheduled(identityScheduledPoll).catch((error: Error) => {
      this.logger.error(`Error:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }

  /**
   * Delete scheduled poll
   * @param args - poll id to delete
   */
  @ApiResponse({ status: HttpStatus.OK, description: "Poll finalization has been deleted" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "BadRequest" })
  @Post("delete")
  async delete(@Body() args: IdentityScheduledPollDto): Promise<IIsPollScheduledResponse> {
    const identityScheduledPoll: IIdentityScheduledPoll = {
      ...args,
      pollId: args.pollId.toString(),
    };

    return this.schedulerService.deleteScheduledPoll(identityScheduledPoll).catch((error: Error) => {
      this.logger.error(`Error:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }
}
