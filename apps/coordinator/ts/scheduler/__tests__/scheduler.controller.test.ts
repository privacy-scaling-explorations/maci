import { EMode } from "@maci-protocol/sdk";
import { SchedulerRegistry } from "@nestjs/schedule";

import { ESupportedNetworks } from "../../common";
import { FileService } from "../../file/file.service";
import { ProofGeneratorService } from "../../proof/proof.service";
import { RedisService } from "../../redis/redis.service";
import { IStoredPollInfo } from "../../redis/types";
import { SessionKeysService } from "../../sessionKeys/sessionKeys.service";
import { SchedulerController } from "../scheduler.controller";
import { SchedulerService } from "../scheduler.service";

describe("v1/scheduler/poll", () => {
  const fileService = new FileService();
  const redisService = new RedisService();
  const schedulerRegistry = new SchedulerRegistry();

  const schedulerController = new SchedulerController(
    new SchedulerService(
      new SessionKeysService(fileService),
      new ProofGeneratorService(fileService, new SessionKeysService(fileService)),
      redisService,
      schedulerRegistry,
    ),
  );

  it("should register a poll for finalization", async () => {
    const pollId = 1;
    const maciAddress = "0x123456789012345678901234567890123";
    const chain = ESupportedNetworks.LOCALHOST;
    const mode = EMode.NON_QV;

    await schedulerController.registerPoll({
      pollId,
      maciAddress,
      chain,
      mode,
    });

    const key = `poll-${chain}-${maciAddress}-${pollId}`;
    const timeout = schedulerRegistry.getTimeout(key) as NodeJS.Timeout | undefined;
    const storedPoll = await redisService.get(key);
    const parsedPoll = storedPoll ? (JSON.parse(storedPoll) as IStoredPollInfo) : null;

    expect(timeout).toBeDefined();
    expect(parsedPoll).toBeDefined();

    expect(parsedPoll?.pollId).toBe(String(pollId));
    expect(parsedPoll?.maciAddress).toBe(maciAddress);
    expect(parsedPoll?.chain).toBe(chain);
  });

  /*
  it("should fail if poll already scheduled", async () => {});

  it("should fail if poll is already finalized", async () => {});

  it("should fail if maci does not exist", async () => {});

  it("should fail if chain is not supported", async () => {});

  it("should fail if poll does not exist", async () => {});
  */
});

/*
describe("v1/scheduler/status", () => {
  it("should return true if poll is scheduled", async () => {});

  it("should return false if poll is not scheduled", async () => {});

  it("should return false if poll does not exist", async () => {});
});

describe("v1/scheduler/delete", () => {
  it("should delete scheduled poll", async () => {});

  it("should do nothing if poll doesn't exit", async () => {});
});
*/
