import { EMode, ESupportedChains, getPoll, isTallied } from "@maci-protocol/sdk";
import { SchedulerRegistry } from "@nestjs/schedule";

import type { IScheduledPoll } from "../../redis/types";

import { ErrorCodes } from "../../common";
import { FileService } from "../../file/file.service";
import { RedisService } from "../../redis/redis.service";
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

    schedulerRegistry = new SchedulerRegistry();
    service = new SchedulerService(sessionKeysService, redisService, schedulerRegistry);

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

    test("should return isPollTallied as false if poll is not merged and is tallied (it is impossible)", async () => {
      (getPoll as jest.Mock).mockResolvedValueOnce({
        isMerged: false,
      });
      (isTallied as jest.Mock).mockResolvedValueOnce(true);

      const { isPollTallied } = await service.getPollFinalizationData({
        maciAddress: scheduledPoll.maciAddress,
        pollId: scheduledPoll.pollId,
        chain: scheduledPoll.chain,
      });

      expect(isPollTallied).toBe(false);
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

      redisService.getAll.mockResolvedValue(polls.map((poll) => getPollKeyFromObject(poll)));
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
      redisService.get.mockImplementation((key: string): Promise<string | null> => {
        const poll = polls.find((p) => getPollKeyFromObject(p) === key && key !== getPollKeyFromObject(polls[1])); // null to simulate missing poll 2 key
        const result = poll ? JSON.stringify(poll) : null;
        return Promise.resolve(result);
      });

      await service.onModuleInit();

      const timeouts = schedulerRegistry.getTimeouts();
      expect(timeouts.length).toBe(polls.length - 1);
    });
  });
});
