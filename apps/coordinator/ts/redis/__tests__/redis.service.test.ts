import { createClient, RedisArgument, RedisClientType } from "@redis/client";

import { ESupportedNetworks } from "../../common";
import { RedisService } from "../redis.service";
import { IScheduledPoll } from "../types";
import { getPollKeyFromObject } from "../utils";

const REDIS__GET_ALL_PREFIX = "*-test";

const scheduledPoll: IScheduledPoll = {
  maciAddress: "0xb83074Ac11fc569AC12F1b7D0C0a6809c3dc355b",
  pollId: "5",
  mode: 1,
  chain: ESupportedNetworks.OPTIMISM_SEPOLIA,
  endDate: 1752534000,
  merged: false,
  proofsGenerated: false,
};

jest.mock("@redis/client", () => {
  const mockRedisClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue("OK"),
    get: jest.fn().mockResolvedValue(null),
    scan: jest.fn().mockResolvedValue({ cursor: "0", keys: ["1", "2", "3"] }),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue("OK"),
    isOpen: true,
  };

  return {
    createClient: jest.fn(() => mockRedisClient),
  };
});

describe("RedisService", () => {
  let service: RedisService;
  let mockRedisClient: jest.Mocked<RedisClientType>;

  beforeAll(async () => {
    service = new RedisService();
    await service.onModuleInit();

    mockRedisClient = createClient() as jest.Mocked<RedisClientType>;
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it("should connect to Redis without issues", () => {
    expect(service.isOpen()).toBe(true);
  });

  it("should set and get a value, and parse it as IScheduledPoll", async () => {
    const key = getPollKeyFromObject(scheduledPoll, true);
    const value = JSON.stringify(scheduledPoll);

    await service.set(key, value);
    mockRedisClient.get.mockResolvedValueOnce(value);

    const stored = await service.get(key);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!) as IScheduledPoll;
    expect(parsed).toEqual(scheduledPoll);
  });

  it("should return null when non-existent key is requested", async () => {
    const nonExistentKey = "non-existent-key";

    const result = await service.get(nonExistentKey);

    expect(result).toBeNull();
  });

  it("should set and get multiple values", async () => {
    const pollOne = { ...scheduledPoll };
    pollOne.pollId = "1";
    const pollKeyOne = getPollKeyFromObject(pollOne, true);

    await service.set(pollKeyOne, JSON.stringify(pollOne));
    mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(pollOne));

    const pollTwo = { ...scheduledPoll };
    pollTwo.pollId = "2";
    const pollKeyTwo = getPollKeyFromObject(pollTwo, true);

    await service.set(pollKeyTwo, JSON.stringify(pollTwo));
    mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(pollTwo));

    const pollThree = { ...scheduledPoll };
    pollThree.pollId = "3";
    const pollKeyThree = getPollKeyFromObject(pollThree, true);

    await service.set(pollKeyThree, JSON.stringify(pollThree));
    mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(pollThree));

    const [storedPollOne, storedPollTwo, storedPollThree] = await Promise.all([
      service.get(pollKeyOne),
      service.get(pollKeyTwo),
      service.get(pollKeyThree),
    ]);

    expect(pollOne).toEqual(JSON.parse(storedPollOne || "{}") as IScheduledPoll);
    expect(pollTwo).toEqual(JSON.parse(storedPollTwo || "{}") as IScheduledPoll);
    expect(pollThree).toEqual(JSON.parse(storedPollThree || "{}") as IScheduledPoll);
  });

  it("should retrieve all values using getAll", async () => {
    const pollOne = { ...scheduledPoll };
    pollOne.pollId = "1";
    const pollKeyOne = getPollKeyFromObject(pollOne, true);
    await service.set(pollKeyOne, JSON.stringify(pollOne));

    const pollTwo = { ...scheduledPoll };
    pollTwo.pollId = "2";
    const pollKeyTwo = getPollKeyFromObject(pollTwo, true);
    await service.set(pollKeyTwo, JSON.stringify(pollTwo));

    const pollThree = { ...scheduledPoll };
    pollThree.pollId = "3";
    const pollKeyThree = getPollKeyFromObject(pollThree, true);
    await service.set(pollKeyThree, JSON.stringify(pollThree));

    mockRedisClient.get.mockImplementation(async (key: RedisArgument) => {
      if (["1", "2", "3"].includes(String(key))) {
        return Promise.resolve("{}");
      }

      return Promise.resolve(null);
    });

    const all = await service.getAll(REDIS__GET_ALL_PREFIX);

    expect(all.length).toBe(3);
  });

  it("should delete a value and return one as confirmation", async () => {
    const key = "delete-me";

    await service.set(key, '{"bye":"now"}');
    const deleted = await service.delete(key);
    const value = await service.get(key);

    expect(deleted).toBe(1);
    expect(value).toBeNull();
  });

  it("should not throw and return zero when deleting non-existent value", async () => {
    mockRedisClient.del.mockResolvedValueOnce(0);

    const key = "non-existent-key";
    const deleted = await service.delete(key);

    expect(deleted).toBe(0);
  });

  it("should return production key name when test is not specified", () => {
    const key = getPollKeyFromObject(scheduledPoll, false);
    expect(key).toBe(`${scheduledPoll.chain}-${scheduledPoll.maciAddress}-poll-${scheduledPoll.pollId}`);
  });

  it("should return test key name when test is specified", () => {
    const key = getPollKeyFromObject(scheduledPoll, true);
    expect(key).toBe(`${scheduledPoll.chain}-${scheduledPoll.maciAddress}-poll-${scheduledPoll.pollId}-test`);
  });
});
