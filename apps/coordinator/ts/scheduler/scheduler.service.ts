import { getPoll, isTallied } from "@maci-protocol/sdk";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";

import { ErrorCodes } from "../common";
import { ProofGeneratorService } from "../proof/proof.service";
import { RedisService } from "../redis/redis.service";
import { IStoredPollInfo } from "../redis/types";
import { SessionKeysService } from "../sessionKeys/sessionKeys.service";

import { IIsPollScheduledResponse, IPollScheduledArgs, IRegisterPollArgs, IRegisterPollResponse } from "./types";

@Injectable()
export class SchedulerService implements OnModuleInit {
  /**
   * Logger
   */
  private readonly logger: Logger;

  constructor(
    private readonly sessionKeysService: SessionKeysService,
    private readonly proofService: ProofGeneratorService,
    private readonly redisService: RedisService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.logger = new Logger(SchedulerService.name);
  }

  async onModuleInit(): Promise<void> {
    await this.restoreTimeouts();
  }

  /**
   * Return the poll end date and whether it is tallied
   * @param args - Arguments to retrieve poll data
   */
  async pollEndDateAndIsTallied({
    pollId,
    maciAddress,
    chain,
    sessionKeyAddress,
    approval,
  }: IRegisterPollArgs): Promise<IRegisterPollResponse> {
    const signer = await this.sessionKeysService.getCoordinatorSigner(chain, sessionKeyAddress, approval);

    const { endDate, isMerged } = await getPoll({
      maciAddress,
      pollId: BigInt(pollId),
      signer,
    });

    const isPollTallied = await isTallied({
      maciAddress,
      pollId: String(pollId),
      signer,
    });

    return {
      endDate: Number(endDate),
      isPollTallied: isMerged ? isPollTallied : false,
    };
  }

  /**
   * Store poll information and schedule its finalization.
   * @param args - Arguments for storing and scheduling poll finalization
   */
  async storeAndSchedule({ maciAddress, pollId, mode, chain, endDate }: IStoredPollInfo): Promise<void> {
    const key = `${chain}-${maciAddress}-poll-${pollId}`;

    await this.redisService.set(
      key,
      JSON.stringify({
        maciAddress,
        pollId,
        mode,
        chain,
        endDate,
      } as IStoredPollInfo),
    );

    const timeout = setTimeout(
      () => {
        this.proofService.finalizePoll({
          maciAddress,
          pollId,
          mode,
          chain,
          endDate,
        });

        this.redisService.delete(key);
      },
      (endDate + 10) * 1000 - Date.now(),
    );
    this.schedulerRegistry.addTimeout(key, timeout);
  }

  /**
   * Update stored poll data
   */
  async updateStoredPoll({
    maciAddress,
    pollId,
    chain,
    hasBeenMerged,
    hasProofsBeenGenerated,
  }: IStoredPollInfo): Promise<void> {
    const key = `${chain}-${maciAddress}-poll-${pollId}`;

    await this.redisService.set(
      key,
      JSON.stringify({
        maciAddress,
        pollId,
        chain,
        hasBeenMerged: hasBeenMerged ?? false,
        hasProofsBeenGenerated: hasProofsBeenGenerated ?? false,
      } as IStoredPollInfo),
    );
  }

  /**
   * Register poll for finalization
   * @param args - register poll for finalization arguments
   */
  async registerPoll({
    maciAddress,
    pollId,
    mode,
    sessionKeyAddress,
    approval,
    chain,
  }: IRegisterPollArgs): Promise<IIsPollScheduledResponse> {
    if (!mode) {
      this.logger.error(`Error: ${ErrorCodes.MODE_NOT_PROVIDED}, mode is required for poll registration`);
      throw new Error(ErrorCodes.MODE_NOT_PROVIDED.toString());
    }

    const { endDate, isPollTallied } = await this.pollEndDateAndIsTallied({
      maciAddress,
      pollId,
      chain,
      sessionKeyAddress,
      approval,
    });

    if (isPollTallied) {
      this.logger.error(`Error: ${ErrorCodes.POLL_ALREADY_TALLIED}, poll has already been finalized`);
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

    await this.storeAndSchedule({
      maciAddress,
      pollId: pollId.toString(),
      mode,
      chain,
      endDate: Number(endDate),
    });

    return { isScheduled: true };
  }

  /**
   * Check if poll is scheduled for finalization
   * @param args - Arguments for checking poll finalization
   * @returns true if poll is scheduled for finalization, false otherwise
   */
  async isPollScheduled({ maciAddress, pollId, chain }: IPollScheduledArgs): Promise<IIsPollScheduledResponse> {
    const key = `${chain}-${maciAddress}-poll-${pollId}`;
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

    const { isPollTallied } = await this.pollEndDateAndIsTallied({
      maciAddress,
      pollId,
      chain,
    });
    if (isPollTallied) {
      // TODO: delete poll scheduled using this.deletePollScheduled
      this.logger.error(`Error: ${ErrorCodes.POLL_ALREADY_TALLIED}, poll has already been finalized`);
      throw new Error(ErrorCodes.POLL_ALREADY_TALLIED.toString());
    }

    return { isScheduled: true };
  }

  /**
   * Delete scheduled poll
   */
  async deletePollScheduled({ maciAddress, pollId, chain }: IPollScheduledArgs): Promise<IIsPollScheduledResponse> {
    const key = `${chain}-${maciAddress}-poll-${pollId}`;

    try {
      this.schedulerRegistry.deleteTimeout(key);
    } catch (error) {
      this.logger.error(`Failed to delete timeout for ${key}:`, error);
    }

    await this.redisService.delete(key);

    return { isScheduled: false };
  }

  /**
   * Restore all scheduled timeouts from Redis
   */
  private async restoreTimeouts(): Promise<void> {
    /*
    const pollKeys = await this.redisService.get("*");

    for (value of pollKeys) {
      // TODO: add try and catchs
      const poll = JSON.parse(value) as IStoredPollInfo;
      const {endDate, isPollTallied} = await this.pollEndDateAndIsTallied({
        maciAddress: poll.maciAddress,
        pollId: poll.pollId,
        chain: poll.chain,
      });

      if (isPollTallied) {
        this.deletePollScheduled({
          maciAddress: poll.maciAddress,
          pollId: poll.pollId,
          chain: poll.chain,
        });
      }

      await this.storeAndSchedule({
        maciAddress: poll.maciAddress,
        pollId: poll.pollId,
        mode: poll.mode,
        chain: poll.chain,
        endDate: endDate,
      });
    }
    */
  }
}
