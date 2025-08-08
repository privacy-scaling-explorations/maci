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
import { ProofGeneratorService } from "../proof/proof.service";
import { RedisService } from "../redis/redis.service";
import { getPollKeyFromObject } from "../redis/utils";
import { SessionKeysService } from "../sessionKeys/sessionKeys.service";

const BUFFER_TIMEOUT = 15 * 1000; // 15 seconds buffer for poll finalization

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
    private readonly proofService: ProofGeneratorService,
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

    const storedPoll = await this.redisService.get(key);

    if (!storedPoll) {
      return { isScheduled: false };
    }

    const isPollTimeoutScheduled = this.schedulerRegistry.doesExist("timeout", key);

    if (!isPollTimeoutScheduled) {
      // delete redis data so user has to reschedule again
      await this.redisService.delete(key);
      return { isScheduled: false };
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

    const [{ endDate, isMerged: isPollMerged }, isPollTallied] = await Promise.all([
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
      isPollTallied,
      isPollMerged,
    };
  }

  /**
   * Finalize poll starting from any step
   *
   * @param args - generate proofs arguments
   */
  async finalizePoll(poll: IScheduledPoll): Promise<void> {
    const { maciAddress, pollId, chain, deploymentBlockNumber, mode, merged, proofsGenerated } = poll;

    const key = getPollKeyFromObject({ maciAddress, pollId, chain });

    const { endDate, isPollMerged } = await this.getPollFinalizationData({
      maciAddress,
      pollId,
      chain,
    });

    if (endDate * 1000 > Date.now()) {
      this.logger.error(`Error finalizing poll ${pollId}: voting period is not over.`);

      await this.deleteScheduledPoll({ maciAddress, pollId, chain });
      await this.setupPollFinalization(poll);

      return;
    }

    if (isPollMerged !== merged) {
      this.logger.error(`Error finalizing poll ${pollId}: is poll merged mismatch. Updating database.`);

      await this.deleteScheduledPoll({ maciAddress, pollId, chain });
      await this.setupPollFinalization({ ...poll, merged: isPollMerged });

      return;
    }

    try {
      if (!merged) {
        await this.proofService
          .merge({
            maciContractAddress: maciAddress,
            pollId: Number(pollId),
            chain,
          })
          .then(() => this.redisService.set(key, JSON.stringify({ ...poll, merged: true })))
          .catch(async (error: Error) => {
            await this.deleteScheduledPoll({ maciAddress, pollId, chain });
            await this.setupPollFinalization(poll);

            throw new Error(`Error merging poll ${pollId}: ${error.message}`);
          });
      }

      if (!proofsGenerated) {
        await this.proofService
          .generate({
            maciContractAddress: maciAddress,
            poll: Number(pollId),
            chain,
            mode,
            startBlock: deploymentBlockNumber,
            blocksPerBatch: 1000,
          })
          .then(() => this.redisService.set(key, JSON.stringify({ ...poll, merged: true, proofsGenerated: true })))
          .catch(async (error: Error) => {
            await this.deleteScheduledPoll({ maciAddress, pollId, chain });
            await this.setupPollFinalization({ ...poll, merged: true });

            throw new Error(`Error generating proofs for poll ${pollId}: ${error.message}`);
          });
      }

      await this.proofService
        .submit({
          maciContractAddress: maciAddress,
          pollId: Number(pollId),
          chain,
        })
        .then(() => this.deleteScheduledPoll({ maciAddress, pollId, chain }))
        .catch(async (error: Error) => {
          await this.deleteScheduledPoll({ maciAddress, pollId, chain });
          await this.setupPollFinalization({ ...poll, merged: true, proofsGenerated: true });

          throw new Error(`Error submitting proofs for poll ${pollId}: ${error.message}`);
        });
    } catch (error) {
      this.logger.error(`Error finalizing poll ${pollId}: ${(error as Error).message}`);
    }
  }

  /**
   * Store poll information and schedule its finalization.
   * @param args - Arguments for storing and scheduling poll finalization
   * @return delay in milliseconds until the poll is scheduled for finalization
   */
  private async setupPollFinalization(poll: IScheduledPoll): Promise<ISetupPollFinalizationResponse> {
    const { maciAddress, pollId, chain, endDate } = poll;
    const key = getPollKeyFromObject({ maciAddress, pollId, chain });

    await this.redisService.set(key, JSON.stringify(poll));

    const shouldBeExecutedIn = endDate * 1000 - Date.now();
    const toBeExecutedIn = shouldBeExecutedIn > 0 ? shouldBeExecutedIn : 0;
    const delay = toBeExecutedIn + BUFFER_TIMEOUT;

    const timeout = setTimeout(async () => {
      await this.finalizePoll(poll);
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

    const isPollTimeoutScheduled = this.schedulerRegistry.doesExist("timeout", key);

    if (isPollTimeoutScheduled) {
      this.schedulerRegistry.deleteTimeout(key);
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
