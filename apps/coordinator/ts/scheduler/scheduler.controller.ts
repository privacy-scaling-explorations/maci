import { Body, Controller, HttpException, HttpStatus, Logger, Post } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { PollScheduledDto, RegisterPollDto } from "./dto";
import { SchedulerService } from "./scheduler.service";

@ApiTags("v1/proof")
@Controller("v1/schedule")
export class SchedulerController {
  /**
   * Logger
   */
  private readonly logger = new Logger(SchedulerController.name);

  /**
   * Initialize SchedulerController
   * @param schedulerService - scheduler service
   * */
  constructor(private readonly schedulerService: SchedulerService) {}

  /**
   * Register poll for finalization
   */
  @ApiResponse({ status: HttpStatus.OK, description: "Poll finalization has been scheduled" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Post("poll")
  async registerPoll(@Body() args: RegisterPollDto): Promise<void> {
    return this.schedulerService.registerPoll(args).catch((error: Error) => {
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
  async isPollScheduled(@Body() args: PollScheduledDto): Promise<boolean> {
    return this.schedulerService.isPollScheduled(args).catch((error: Error) => {
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
  async deletePollScheduled(@Body() args: PollScheduledDto): Promise<void> {
    return this.schedulerService.deletePollScheduled(args).catch((error: Error) => {
      this.logger.error(`Error:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    });
  }
}
