import { getPoll } from "@maci-protocol/sdk";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";

import { ErrorCodes } from "../common";
import { RedisService } from "../redis/redis.service";
import { IStoredPollInfo } from "../redis/types";
import { SessionKeysService } from "../sessionKeys/sessionKeys.service";

import { IPollScheduledArgs, ISchedulePollFinalizationArgs } from "./types";

@Injectable()
export class SchedulerService implements OnModuleInit {
  /**
   * Logger
   */
  private readonly logger: Logger;

  constructor(
    private readonly sessionKeysService: SessionKeysService,
    private readonly redisService: RedisService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.logger = new Logger(SchedulerService.name);
  }

  async onModuleInit(): Promise<void> {
    await this.restoreTimeouts();
  }

  /**
   * Store poll information and schedule its finalization.
   * @param args - Arguments for storing and scheduling poll finalization
   */
  async storeAndSchedule({ pollId, maciAddress, chain, endDate }: IStoredPollInfo): Promise<void> {
    const key = `poll-${chain}-${maciAddress}-${pollId}`;

    await this.redisService.set(
      key,
      JSON.stringify({
        maciAddress,
        pollId,
        chain,
        endDate,
      } as IStoredPollInfo),
    );

    const timeout = setTimeout(
      () => {
        // TODO: implement poll finalization logic
        // Add the logic here
        this.redisService.delete(key);
      },
      endDate * 1000 - Date.now(),
    );
    this.schedulerRegistry.addTimeout(key, timeout);
  }

  /**
   * Register poll for finalization
   * @param args - register poll for finalization arguments
   */
  async registerPoll({
    maciAddress,
    pollId,
    sessionKeyAddress,
    approval,
    chain,
  }: ISchedulePollFinalizationArgs): Promise<void> {
    const signer = await this.sessionKeysService.getCoordinatorSigner(chain, sessionKeyAddress, approval);

    const pollData = await getPoll({
      maciAddress,
      pollId: BigInt(pollId),
      signer,
    });
    const { endDate, isMerged } = pollData;

    const now = Math.floor(Date.now() / 1000);

    // Check if the poll not already scheduled
    const storedPoll = await this.redisService.get(`poll-${pollId}`);
    if (storedPoll) {
      this.logger.error(`Error: ${ErrorCodes.POLL_ALREADY_SCHEDULED}, poll is already scheduled`);
      throw new Error(ErrorCodes.POLL_ALREADY_SCHEDULED.toString());
    }

    if (Number(endDate) <= now && isMerged) {
      this.logger.error(`Error: ${ErrorCodes.POLL_ALREADY_ENDED}, poll has already been finalized`);
      throw new Error(ErrorCodes.POLL_ALREADY_ENDED.toString());
    }

    await this.storeAndSchedule({
      maciAddress,
      pollId: pollId.toString(),
      chain,
      endDate: Number(endDate),
    });
  }

  /**
   * Check if poll is scheduled for finalization
   * @param args - Arguments for checking poll finalization
   * @returns true if poll is scheduled for finalization, false otherwise
   */
  async isPollScheduled({ maciAddress, pollId, chain }: IPollScheduledArgs): Promise<boolean> {
    const key = `poll-${chain}-${maciAddress}-${pollId}`;
    const storedPoll = await this.redisService.get(key);
    if (!storedPoll) {
      return false;
    }

    const timeout = this.schedulerRegistry.getTimeout(key) as NodeJS.Timeout | undefined;
    if (!timeout) {
      // delete redis data so user has to reschedule again
      await this.redisService.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete scheduled poll
   */
  async deletePollScheduled({ maciAddress, pollId, chain }: IPollScheduledArgs): Promise<void> {
    const key = `poll-${chain}-${maciAddress}-${pollId}`;

    this.schedulerRegistry.deleteTimeout(key);
    await this.redisService.delete(key);
  }

  /**
   * Restore all scheduled timeouts from Redis
   */
  private async restoreTimeouts(): Promise<void> {
    /*
    try {
      const pollKeys = await this.redisService.getKeys("poll-*");

      for (const key of pollKeys) {
        const pollDataStr = await this.redisService.get(key);
        if (!pollDataStr) {
          continue;
        }

        try {
          const pollData = JSON.parse(pollDataStr);

          // Only restore if poll hasn't ended and isn't tallied
          const currentTime = Date.now();
          const endTime = pollData.endDate * 1000;

          if (endTime > currentTime && !pollData.isTallied && pollData.timeoutScheduled) {
            console.log(`Restoring timeout for poll ${pollData.pollId}`);
            this.scheduleTimeout(pollData.pollId, pollData.endDate);
          } else if (endTime <= currentTime && !pollData.isTallied) {
            // Poll has ended but wasn't finalized, do it now
            console.log(`Poll ${pollData.pollId} ended while service was down, finalizing now`);
            this.finalizePoll(pollData.pollId);
          }
        } catch (error) {
          this.logger.error(`Failed to restore timeout for ${key}:`, error);
        }
      }
    } catch (error) {
      this.logger.error("Failed to restore timeouts:", error);
    }
    */
  }
}
