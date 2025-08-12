import { EMode, ESupportedChains } from "@maci-protocol/sdk";
import { createClient, type RedisClientType } from "@redis/client";
import dotenv from "dotenv";

import { RedisService } from "../ts/redis/redis.service";
import { type IScheduledPoll } from "../ts/redis/types";
import { getPollKeyFromObject } from "../ts/redis/utils";

const REDIS__GET_ALL_PREFIX = "*-test";

const scheduledPoll: IScheduledPoll = {
  maciAddress: "0xb83074Ac11fc569AC12F1b7D0C0a6809c3dc355b",
  pollId: "5",
  mode: EMode.NON_QV,
  chain: ESupportedChains.Sepolia,
  endDate: 1752534000,
  deploymentBlockNumber: 1,
  merged: false,
  proofsGenerated: false,
};

dotenv.config();

describe("RedisService", () => {
  let redisClient: RedisClientType;
  let service: RedisService;

  beforeAll(async () => {
    redisClient = createClient({
      url: `redis://${process.env.COORDINATOR_REDIS_HOST}:${process.env.COORDINATOR_REDIS_PORT}`,
      disableOfflineQueue: true,
    });
    await redisClient.connect();

    service = new RedisService();
    await service.onModuleInit();
  });

  afterEach(async () => {
    // Clean up after each test
    const keys = await redisClient.keys(REDIS__GET_ALL_PREFIX);

    await Promise.all(keys.map((key) => redisClient.del(key)));
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  test("should connect to Redis without issues", () => {
    expect(service.isOpen()).toBe(true);
  });

  test("should set and get a value, and parse it as IScheduledPoll", async () => {
    const key = getPollKeyFromObject(scheduledPoll, true);
    const value = JSON.stringify(scheduledPoll);

    await service.set(key, value);

    const stored = await service.get(key);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!) as IScheduledPoll;
    expect(parsed).toEqual(scheduledPoll);
  });

  test("should return null when non-existent key is requested", async () => {
    const nonExistentKey = "non-existent-key";
    const result = await service.get(nonExistentKey);

    expect(result).toBeNull();
  });

  test("should set and get multiple values", async () => {
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

    const [storedPollOne, storedPollTwo, storedPollThree] = await Promise.all([
      service.get(pollKeyOne),
      service.get(pollKeyTwo),
      service.get(pollKeyThree),
    ]);

    expect(pollOne).toEqual(JSON.parse(storedPollOne || "{}") as IScheduledPoll);
    expect(pollTwo).toEqual(JSON.parse(storedPollTwo || "{}") as IScheduledPoll);
    expect(pollThree).toEqual(JSON.parse(storedPollThree || "{}") as IScheduledPoll);
  });

  test("should retrieve all values using getAll", async () => {
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

    const all = await service.getAll(REDIS__GET_ALL_PREFIX);

    expect(all.length).toBe(3);
  });

  test("should delete a value and return one as confirmation", async () => {
    const key = "delete-me";

    await service.set(key, '{"bye":"now"}');
    const deleted = await service.delete(key);
    const value = await service.get(key);

    expect(deleted).toBe(1);
    expect(value).toBeNull();
  });

  test("should not throw and return zero when deleting non-existent value", async () => {
    const key = "non-existent-key";
    const deleted = await service.delete(key);

    expect(deleted).toBe(0);
  });

  test("should update a value using set with same key", async () => {
    const key = getPollKeyFromObject(scheduledPoll, true);
    const valuePoll = JSON.stringify(scheduledPoll);

    await service.set(key, valuePoll);

    const updatedPoll = { ...scheduledPoll, endDate: 1 };
    const updatedPollValue = JSON.stringify(updatedPoll);

    await service.set(key, updatedPollValue);

    const stored = await service.get(key);
    const parsed = JSON.parse(stored!) as IScheduledPoll;

    expect(parsed.endDate).toBe(updatedPoll.endDate);
  });
});
