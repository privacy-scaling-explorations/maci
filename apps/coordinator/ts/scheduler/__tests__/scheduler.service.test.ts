import { EMode, ESupportedChains, getPoll, isTallied } from "@maci-protocol/sdk";
import { SchedulerRegistry } from "@nestjs/schedule";

import type { IScheduledPoll } from "../../redis/types";

import { ErrorCodes } from "../../common";
import { FileService } from "../../file/file.service";
import { type ProofGeneratorService } from "../../proof/proof.service";
import { type RedisService } from "../../redis/redis.service";
import { getPollKeyFromObject } from "../../redis/utils";
import { SessionKeysService } from "../../sessionKeys/sessionKeys.service";
import { SchedulerService } from "../scheduler.service";

const scheduledPoll: IScheduledPoll = {
  maciAddress: "0x0",
  pollId: "5",
  mode: EMode.NON_QV,
  chain: ESupportedChains.OptimismSepolia,
  endDate: 1752534000,
  deploymentBlockNumber: 1,
  merged: false,
  proofsGenerated: false,
};

jest.mock("@maci-protocol/sdk", (): unknown => ({
  ...jest.requireActual("@maci-protocol/sdk"),
  getPoll: jest.fn().mockResolvedValue({
    address: "0x123",
    endDate: 1752534000,
    isMerged: false,
  }),
  isTallied: jest.fn().mockResolvedValue(false),
}));

describe("SchedulerService", () => {
  let fileService: FileService;
  let sessionKeysService: SessionKeysService;
  let proofService: jest.Mocked<ProofGeneratorService>;

  let redisService: jest.Mocked<RedisService>;

  let schedulerRegistry: SchedulerRegistry;
  let service: SchedulerService;

  beforeAll(async () => {
    fileService = new FileService();
    sessionKeysService = new SessionKeysService(fileService);

    // Mock RedisService methods as needed
    redisService = {
      get: jest.fn().mockResolvedValue(JSON.stringify(scheduledPoll)),
      set: jest.fn(),
      delete: jest.fn(),
      getAll: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<RedisService>;

    // Mock ProofGeneratorService methods as needed
    proofService = {
      merge: jest.fn().mockResolvedValue({}),
      generate: jest.fn().mockResolvedValue({}),
      submit: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<ProofGeneratorService>;

    schedulerRegistry = new SchedulerRegistry();
    service = new SchedulerService(sessionKeysService, redisService, schedulerRegistry, proofService);

    await service.onModuleInit();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();

    const timeouts = schedulerRegistry.getTimeouts();
    // Clear all timeouts in the mock scheduler registry
    timeouts.forEach((timeout) => {
      if (timeout.includes("-test")) {
        schedulerRegistry.deleteTimeout(timeout);
      }
    });
  });

  describe(`isPollScheduled`, () => {
    test("should return true if poll is saved, scheduled and not tallied", async () => {
      await service.registerPoll(scheduledPoll);

      const isPollScheduled = await service.isPollScheduled(scheduledPoll);
      expect(isPollScheduled.isScheduled).toBe(true);
    });

    test("should return false if poll is not saved", async () => {
      redisService.get.mockResolvedValueOnce(null);

      const isPollScheduled = await service.isPollScheduled(scheduledPoll);
      expect(isPollScheduled.isScheduled).toBe(false);
    });

    test("should return false if poll is saved and timeout not scheduled", async () => {
      await service.registerPoll(scheduledPoll);
      schedulerRegistry.deleteTimeout(getPollKeyFromObject(scheduledPoll));

      const isPollScheduled = await service.isPollScheduled(scheduledPoll);
      expect(isPollScheduled.isScheduled).toBe(false);
    });

    test("should return false if poll is scheduled but not saved", async () => {
      redisService.get.mockResolvedValueOnce(null);

      const isPollScheduled = await service.isPollScheduled(scheduledPoll);
      expect(isPollScheduled.isScheduled).toBe(false);
    });

    test("should throw an error if poll is already tallied", async () => {
      await service.registerPoll(scheduledPoll);

      (getPoll as jest.Mock).mockResolvedValueOnce({
        isMerged: true,
      });
      (isTallied as jest.Mock).mockResolvedValueOnce(true);

      await expect(service.isPollScheduled(scheduledPoll)).rejects.toThrow(ErrorCodes.POLL_ALREADY_TALLIED.toString());
    });
  });

  describe("getPollFinalizationData", () => {
    test("should return the end date and tallied status of a poll", async () => {
      (getPoll as jest.Mock).mockResolvedValueOnce({
        isMerged: false,
        endDate: scheduledPoll.endDate,
      });
      (isTallied as jest.Mock).mockResolvedValueOnce(false);

      const { endDate, isPollTallied } = await service.getPollFinalizationData({
        maciAddress: scheduledPoll.maciAddress,
        pollId: scheduledPoll.pollId,
        chain: scheduledPoll.chain,
      });

      expect(endDate).toBe(scheduledPoll.endDate);
      expect(isPollTallied).toBe(false);
    });

    test("should return isPollTallied as false if poll is not merged and is not tallied", async () => {
      (getPoll as jest.Mock).mockResolvedValueOnce({
        isMerged: false,
      });
      (isTallied as jest.Mock).mockResolvedValueOnce(false);

      const { isPollTallied } = await service.getPollFinalizationData({
        maciAddress: scheduledPoll.maciAddress,
        pollId: scheduledPoll.pollId,
        chain: scheduledPoll.chain,
      });

      expect(isPollTallied).toBe(false);
    });

    test("should return isPollTallied as false if poll is merged and is not tallied", async () => {
      (getPoll as jest.Mock).mockResolvedValueOnce({
        isMerged: true,
      });
      (isTallied as jest.Mock).mockResolvedValueOnce(false);

      const { isPollTallied } = await service.getPollFinalizationData({
        maciAddress: scheduledPoll.maciAddress,
        pollId: scheduledPoll.pollId,
        chain: scheduledPoll.chain,
      });

      expect(isPollTallied).toBe(false);
    });
  });

  describe("finalizePoll", () => {
    test("should finalize a poll and delete the scheduled poll (redis and timeout)", async () => {
      await service.finalizePoll(scheduledPoll);

      const isPollScheduled = await service.isPollScheduled(scheduledPoll);
      const doesExist = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(scheduledPoll));

      expect(isPollScheduled.isScheduled).toBe(false);
      expect(doesExist).toBe(false);
    });

    test("should finalize two polls", async () => {
      const pollOne = { ...scheduledPoll, pollId: "1" };
      const pollTwo = { ...scheduledPoll, pollId: "2" };

      await Promise.all([service.finalizePoll(pollOne), service.finalizePoll(pollTwo)]);

      const isPollScheduledOne = await service.isPollScheduled(pollOne);
      const isPollScheduledTwo = await service.isPollScheduled(pollTwo);

      const doesExistOne = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(pollOne));
      const doesExistTwo = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(pollTwo));

      expect(isPollScheduledOne.isScheduled).toBe(false);
      expect(isPollScheduledTwo.isScheduled).toBe(false);
      expect(doesExistOne).toBe(false);
      expect(doesExistTwo).toBe(false);
    });

    test("should finalize a poll that has been merged and saved as merged in database", async () => {
      (getPoll as jest.Mock).mockResolvedValueOnce({
        isMerged: true,
      });

      await service.finalizePoll({ ...scheduledPoll, merged: true });

      const isPollScheduled = await service.isPollScheduled(scheduledPoll);
      const doesExist = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(scheduledPoll));

      expect(isPollScheduled.isScheduled).toBe(false);
      expect(doesExist).toBe(false);
    });

    test("should finalize a poll that has proofs generated and saved as proofsGenerated in database", async () => {
      (getPoll as jest.Mock).mockResolvedValueOnce({
        isMerged: true,
      });

      await service.finalizePoll({ ...scheduledPoll, merged: true, proofsGenerated: true });

      const isPollScheduled = await service.isPollScheduled(scheduledPoll);
      const doesExist = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(scheduledPoll));

      expect(isPollScheduled.isScheduled).toBe(false);
      expect(doesExist).toBe(false);
    });

    test("should reschedule a poll if database says is not merged but it has been merged", async () => {
      (proofService.merge as jest.Mock).mockRejectedValueOnce(new Error("Poll already merged"));
      await service.registerPoll({ ...scheduledPoll, merged: false });

      await service.finalizePoll(scheduledPoll);

      const isPollRescheduled = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(scheduledPoll));
      expect(isPollRescheduled).toBe(true);
    });

    test("should reschedule a poll if database says is merged but it has not been merged", async () => {
      (proofService.generate as jest.Mock).mockRejectedValueOnce(new Error("Poll not merged"));
      await service.registerPoll({ ...scheduledPoll, merged: true });

      await service.finalizePoll(scheduledPoll);

      const isPollRescheduled = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(scheduledPoll));
      expect(isPollRescheduled).toBe(true);
    });

    test("should reschedule a poll if merge fails", async () => {
      (proofService.merge as jest.Mock).mockRejectedValueOnce(new Error("Merge failed"));

      await service.finalizePoll(scheduledPoll);

      const isPollScheduled = await service.isPollScheduled(scheduledPoll);
      const doesExist = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(scheduledPoll));

      expect(isPollScheduled.isScheduled).toBe(true);
      expect(doesExist).toBe(true);
    });

    test("should save merged as true and reschedule if generate proofs fails", async () => {
      (proofService.generate as jest.Mock).mockRejectedValueOnce(new Error("Proof generation failed"));

      await service.finalizePoll(scheduledPoll);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.set).toHaveBeenCalledWith(
        getPollKeyFromObject({
          maciAddress: scheduledPoll.maciAddress,
          pollId: scheduledPoll.pollId,
          chain: scheduledPoll.chain,
        }),
        JSON.stringify({ ...scheduledPoll, merged: true }),
      );

      const isPollScheduled = await service.isPollScheduled(scheduledPoll);
      const doesExist = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(scheduledPoll));

      expect(isPollScheduled.isScheduled).toBe(true);
      expect(doesExist).toBe(true);
    });

    test("should save proofsGenerated as true and reschedule if submit fails", async () => {
      (proofService.submit as jest.Mock).mockRejectedValueOnce(new Error("Proof submission failed"));

      await service.finalizePoll(scheduledPoll);

      // after merge executed correctly
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.set).toHaveBeenNthCalledWith(
        1,
        getPollKeyFromObject({
          maciAddress: scheduledPoll.maciAddress,
          pollId: scheduledPoll.pollId,
          chain: scheduledPoll.chain,
        }),
        JSON.stringify({ ...scheduledPoll, merged: true }),
      );

      // after generate proofs executed correctly
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.set).toHaveBeenNthCalledWith(
        2,
        getPollKeyFromObject({
          maciAddress: scheduledPoll.maciAddress,
          pollId: scheduledPoll.pollId,
          chain: scheduledPoll.chain,
        }),
        JSON.stringify({ ...scheduledPoll, merged: true, proofsGenerated: true }),
      );

      // after submit failed
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.set).toHaveBeenNthCalledWith(
        3,
        getPollKeyFromObject({
          maciAddress: scheduledPoll.maciAddress,
          pollId: scheduledPoll.pollId,
          chain: scheduledPoll.chain,
        }),
        JSON.stringify({ ...scheduledPoll, merged: true, proofsGenerated: true }),
      );

      const isPollScheduled = await service.isPollScheduled(scheduledPoll);
      const doesExist = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(scheduledPoll));

      expect(isPollScheduled.isScheduled).toBe(true);
      expect(doesExist).toBe(true);
    });
  });

  describe("registerPoll", () => {
    test("should register a poll for finalization", async () => {
      const { isScheduled } = await service.registerPoll(scheduledPoll);

      const isPollScheduled = await service.isPollScheduled(scheduledPoll);
      const isPollTimeoutScheduled = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(scheduledPoll));

      expect(isScheduled).toBe(true);
      expect(isPollScheduled.isScheduled).toBe(true);
      expect(isPollTimeoutScheduled).toBe(true);
    });

    test("should register 2 polls and schedule their finalization", async () => {
      const pollOne = { ...scheduledPoll, pollId: "1" };
      const pollTwo = { ...scheduledPoll, pollId: "2" };

      const { isScheduled: isScheduledOne } = await service.registerPoll(pollOne);
      const { isScheduled: isScheduledTwo } = await service.registerPoll(pollTwo);

      const [isPollScheduledOne, isPollScheduledTwo] = await Promise.all([
        service.isPollScheduled(pollOne),
        service.isPollScheduled(pollTwo),
      ]);

      const isPollOneTimeoutScheduled = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(pollOne));
      const isPollTwoTimeoutScheduled = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(pollTwo));

      expect(isScheduledOne).toBe(true);
      expect(isScheduledTwo).toBe(true);
      expect(isPollScheduledOne.isScheduled).toBe(true);
      expect(isPollScheduledTwo.isScheduled).toBe(true);
      expect(isPollOneTimeoutScheduled).toBe(true);
      expect(isPollTwoTimeoutScheduled).toBe(true);
    });

    test("should schedule finalization after the poll has ended", async () => {
      const endedPoll = { ...scheduledPoll, endDate: 1 };
      const { isScheduled } = await service.registerPoll(endedPoll);

      const isPollScheduled = await service.isPollScheduled(endedPoll);
      const isPollTimeoutScheduled = schedulerRegistry.doesExist("timeout", getPollKeyFromObject(endedPoll));

      expect(isScheduled).toBe(true);
      expect(isPollScheduled.isScheduled).toBe(true);
      expect(isPollTimeoutScheduled).toBe(true);
    });

    test("should throw an error if poll is already tallied", async () => {
      (getPoll as jest.Mock).mockResolvedValueOnce({
        isMerged: true,
      });
      (isTallied as jest.Mock).mockResolvedValueOnce(true);

      await expect(service.registerPoll(scheduledPoll)).rejects.toThrow(ErrorCodes.POLL_ALREADY_TALLIED.toString());
    });

    test("should throw an error if poll is already scheduled", async () => {
      await service.registerPoll(scheduledPoll);

      await expect(service.registerPoll(scheduledPoll)).rejects.toThrow(ErrorCodes.POLL_ALREADY_SCHEDULED.toString());
    });
  });

  describe("deleteScheduledPoll", () => {
    test("should delete a scheduled poll", async () => {
      await service.registerPoll(scheduledPoll);
      const isPollScheduled = await service.isPollScheduled(scheduledPoll);

      const { isScheduled } = await service.deleteScheduledPoll(scheduledPoll);

      const isPollDeleted = await service.isPollScheduled(scheduledPoll);

      expect(isPollScheduled.isScheduled).toBe(true);
      expect(isScheduled).toBe(false);
      expect(isPollDeleted.isScheduled).toBe(false);
    });

    test("should return isPollScheduled as false if poll was not scheduled", async () => {
      const { isScheduled } = await service.deleteScheduledPoll(scheduledPoll);

      expect(isScheduled).toBe(false);
    });
  });

  describe("restoreTimeouts", () => {
    const polls = [
      { ...scheduledPoll, pollId: "1" },
      { ...scheduledPoll, pollId: "2" },
      { ...scheduledPoll, pollId: "3" },
    ];

    beforeEach(async () => {
      await Promise.all([
        service.registerPoll(polls[0]),
        service.registerPoll(polls[1]),
        service.registerPoll(polls[2]),
      ]);

      schedulerRegistry.deleteTimeout(getPollKeyFromObject(polls[0]));
      schedulerRegistry.deleteTimeout(getPollKeyFromObject(polls[1]));
      schedulerRegistry.deleteTimeout(getPollKeyFromObject(polls[2]));

      redisService.getAll.mockResolvedValue(
        polls.map((poll) => ({
          key: getPollKeyFromObject(poll),
          value: JSON.stringify(poll),
        })),
      );
      redisService.get.mockImplementation((key: string): Promise<string | null> => {
        const poll = polls.find((p) => getPollKeyFromObject(p) === key);
        const result = poll ? JSON.stringify(poll) : null;
        return Promise.resolve(result);
      });
    });

    afterEach(() => {
      jest.clearAllMocks();

      (getPoll as jest.Mock).mockReset().mockResolvedValue({
        address: "0x123",
        endDate: 1752534000,
        isMerged: false,
      });
      (isTallied as jest.Mock).mockReset().mockResolvedValue(false);
    });

    test("should restore scheduled polls from Redis", async () => {
      await service.onModuleInit();

      const timeouts = schedulerRegistry.getTimeouts();

      timeouts.forEach((timeout, i) => {
        expect(timeout).toBe(getPollKeyFromObject(polls[i]));
      });
      expect(timeouts.length).toBe(polls.length);
    });

    test("should not restore timeouts for tallied polls", async () => {
      (getPoll as jest.Mock).mockImplementation(({ pollId }) => Promise.resolve({ isMerged: pollId === 2n }));
      (isTallied as jest.Mock).mockImplementation(({ pollId }) => Promise.resolve(pollId === "2"));

      await service.onModuleInit();

      const timeouts = schedulerRegistry.getTimeouts();

      expect(timeouts.length).toBe(polls.length - 1);
    });

    test("should not throw if Redis returns null for a key and should delete register", async () => {
      redisService.getAll.mockResolvedValueOnce([
        { key: getPollKeyFromObject(polls[0]), value: JSON.stringify(polls[0]) },
        { key: getPollKeyFromObject(polls[1]), value: JSON.stringify(polls[1]) },
        // poll 2 is missing
      ]);

      await service.onModuleInit();

      const timeouts = schedulerRegistry.getTimeouts();
      expect(timeouts.length).toBe(polls.length - 1);
    });
  });
});
