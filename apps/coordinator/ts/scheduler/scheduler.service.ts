import { getPoll, isTallied } from "@maci-protocol/sdk";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";

import type {
  IIsPollScheduledResponse,
  IGetPollFinalizationData,
  IIdentityPollWithSignerArgs,
  ISchedulePollWithSignerArgs,
  ISetupPollFinalizationResponse,
} from "./types";
import type { IIdentityScheduledPoll, IScheduledPoll } from "../redis/types";

import { ErrorCodes } from "../common";
import { RedisService } from "../redis/redis.service";
import { getPollKeyFromObject } from "../redis/utils";
import { SessionKeysService } from "../sessionKeys/sessionKeys.service";

const BUFFER_TIMEOUT = 10 * 1000; // 10 seconds buffer for poll finalization

@Injectable()
export class SchedulerService implements OnModuleInit {
  /**
   * Logger
   */
  private readonly logger: Logger;

  /**
   * Create a new scheduler service instance.
   * @param sessionKeysService - session keys service to manage session keys
   * @param redisService - redis service to interact with Redis database
   * @param schedulerRegistry - scheduler registry to manage scheduled tasks
   */
  constructor(
    private readonly sessionKeysService: SessionKeysService,
    private readonly redisService: RedisService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.logger = new Logger(SchedulerService.name);
  }

  /**
   * Instantiate and schedule the saved polls in the database
   * @dev it is a lifecycle hook provided by NestJS that is called after all dependencies
   * are injected and the module is fully initialized.
   * This ensures your service is ready and all dependencies are available.
   */
  async onModuleInit(): Promise<void> {
    await this.restoreTimeouts();
  }

  /**
   * Check if poll is scheduled for finalization
   * @param args - Arguments for checking poll finalization
   * @returns true if poll is scheduled for finalization, false otherwise
   */
  async isPollScheduled(scheduledPoll: IIdentityScheduledPoll): Promise<IIsPollScheduledResponse> {
    const key = getPollKeyFromObject(scheduledPoll);
    const { maciAddress, pollId, chain } = scheduledPoll;

    const storedPoll = await this.redisService.get(key);

    if (!storedPoll) {
      return { isScheduled: false };
    }

    try {
      this.schedulerRegistry.getTimeout(key);
    } catch (error) {
      // delete redis data so user has to reschedule again
      await this.redisService.delete(key);
      return { isScheduled: false };
    }

    const { isPollTallied } = await this.getPollFinalizationData({
      maciAddress,
      pollId,
      chain,
    });

    if (isPollTallied) {
      this.deleteScheduledPoll({ maciAddress, pollId, chain });
      this.logger.error(`Error: ${ErrorCodes.POLL_ALREADY_TALLIED}, poll has already been tallied`);
      throw new Error(ErrorCodes.POLL_ALREADY_TALLIED.toString());
    }

    return { isScheduled: true };
  }

  /**
   * Return the poll end date and whether it is tallied
   * @param args - Arguments to retrieve poll data
   */
  async getPollFinalizationData({
    pollId,
    maciAddress,
    chain,
    sessionKeyAddress,
    approval,
  }: IIdentityPollWithSignerArgs): Promise<IGetPollFinalizationData> {
    const signer = await this.sessionKeysService.getCoordinatorSigner(chain, sessionKeyAddress, approval);

    const [{ endDate, isMerged }, isPollTallied] = await Promise.all([
      getPoll({
        maciAddress,
        pollId: BigInt(pollId),
        signer,
      }),
      isTallied({
        maciAddress,
        pollId: String(pollId),
        signer,
      }),
    ]);

    return {
      endDate: Number(endDate),
      isPollTallied: isMerged ? isPollTallied : false,
    };
  }

  /**
   * Store poll information and schedule its finalization.
   * @param args - Arguments for storing and scheduling poll finalization
   * @return delay in milliseconds until the poll is scheduled for finalization
   */
  private async setupPollFinalization({
    maciAddress,
    pollId,
    mode,
    deploymentBlockNumber,
    chain,
    endDate,
  }: IScheduledPoll): Promise<ISetupPollFinalizationResponse> {
    const key = getPollKeyFromObject({ maciAddress, pollId, chain });

    await this.redisService.set(
      key,
      JSON.stringify({
        maciAddress,
        pollId,
        mode,
        deploymentBlockNumber,
        chain,
        endDate,
      } as IScheduledPoll),
    );

    const shouldBeExecutedIn = endDate * 1000 - Date.now();
    const toBeExecutedIn = shouldBeExecutedIn > 0 ? shouldBeExecutedIn : 0;
    const delay = toBeExecutedIn + BUFFER_TIMEOUT;

    const timeout = setTimeout(() => {
      // TODO: execute this.finalizePoll (implementing this in the next PR)
      this.redisService.delete(key);
    }, delay);

    const isPollTimeoutScheduled = this.schedulerRegistry.doesExist("timeout", key);

    if (isPollTimeoutScheduled) {
      this.logger.error(`Error: ${ErrorCodes.POLL_ALREADY_SCHEDULED}, poll is already scheduled`);
      throw new Error(ErrorCodes.POLL_ALREADY_SCHEDULED.toString());
    }

    this.schedulerRegistry.addTimeout(key, timeout);

    return { delay };
  }

  /**
   * Schedule poll for finalization
   * @param args - Arguments to register poll for finalization
   * @returns Response object with isScheduled property indicating the poll is scheduled
   */
  async registerPoll({
    maciAddress,
    pollId,
    chain,
    mode,
    deploymentBlockNumber,
    sessionKeyAddress,
    approval,
  }: ISchedulePollWithSignerArgs): Promise<IIsPollScheduledResponse> {
    const { endDate, isPollTallied } = await this.getPollFinalizationData({
      maciAddress,
      pollId,
      chain,
      sessionKeyAddress,
      approval,
    });

    if (isPollTallied) {
      this.logger.error(`Error: ${ErrorCodes.POLL_ALREADY_TALLIED}, poll has already been tallied`);
      throw new Error(ErrorCodes.POLL_ALREADY_TALLIED.toString());
    }

    const { isScheduled } = await this.isPollScheduled({
      maciAddress,
      pollId,
      chain,
    });

    if (isScheduled) {
      this.logger.error(`Error: ${ErrorCodes.POLL_ALREADY_SCHEDULED}, poll is already scheduled`);
      throw new Error(ErrorCodes.POLL_ALREADY_SCHEDULED.toString());
    }

    await this.setupPollFinalization({
      maciAddress,
      pollId,
      chain,
      deploymentBlockNumber,
      mode,
      endDate,
      merged: false,
      proofsGenerated: false,
    });

    return { isScheduled: true };
  }

  /**
   * Delete scheduled poll
   * @param args - Arguments to identify the scheduled poll
   * @returns Response object with isScheduled property indicating the poll is no longer scheduled
   */
  async deleteScheduledPoll(scheduledPoll: IIdentityScheduledPoll): Promise<IIsPollScheduledResponse> {
    const key = getPollKeyFromObject(scheduledPoll);

    try {
      this.schedulerRegistry.deleteTimeout(key);
    } catch (error) {
      this.logger.error(`Failed to delete timeout for ${key}:`);
    }

    await this.redisService.delete(key);

    return { isScheduled: false };
  }

  /**
   * Restore all scheduled timeouts from Redis
   */
  private async restoreTimeouts(): Promise<void> {
    const polls = await this.redisService.getAll();

    await Promise.all(
      polls.map(async ({ key, value }) => {
        this.logger.log(`Restoring timeout for poll key: ${key}`);
        try {
          if (!value) {
            await this.redisService.delete(key);
            return;
          }

          const poll = JSON.parse(value) as IScheduledPoll;

          const { endDate, isPollTallied } = await this.getPollFinalizationData({
            maciAddress: poll.maciAddress,
            pollId: poll.pollId,
            chain: poll.chain,
          });

          if (isPollTallied) {
            await this.deleteScheduledPoll({
              maciAddress: poll.maciAddress,
              pollId: poll.pollId,
              chain: poll.chain,
            });
            return;
          }

          const { delay } = await this.setupPollFinalization({ ...poll, endDate });

          this.logger.log(`poll ${value} to be finalized at ${new Date(Date.now() + delay).toISOString()}`);
        } catch (error) {
          this.logger.error(`Error restoring timeout for poll key: ${key}`, error);
        }
      }),
    );
  }
}
