import { jest } from "@jest/globals";
import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "@maci-protocol/sdk";
import { ZeroAddress } from "ethers";

import type { MessageBatchService } from "../../messageBatch/messageBatch.service.js";
import type { MessageRepository } from "../message.repository.js";

import { MessageService } from "../message.service.js";

import { defaultMessages, defaultSaveMessagesDto } from "./utils.js";

jest.mock("@maci-protocol/sdk", (): unknown => ({
  getDefaultSigner: jest.fn(),
  MACI__factory: {
    connect: jest.fn(),
  },
  Poll__factory: {
    connect: jest.fn(),
  },
}));

describe("MessageService", () => {
  const mockMaciContract = {
    polls: jest.fn().mockImplementation(() => Promise.resolve({ poll: ZeroAddress })),
  };

  const mockPollContract = {
    hashMessageAndEncPubKey: jest.fn().mockImplementation(() => Promise.resolve("hash")),
    relayMessagesBatch: jest
      .fn()
      .mockImplementation(() => Promise.resolve({ wait: jest.fn().mockImplementation(() => Promise.resolve()) })),
  };

  const mockMessageBatchService = {
    saveMessageBatches: jest.fn().mockImplementation((args) => Promise.resolve(args)),
  };

  const mockRepository = {
    create: jest.fn().mockImplementation(() => Promise.resolve(defaultMessages)),
    find: jest.fn().mockImplementation(() => Promise.resolve(defaultMessages)),
  };

  beforeEach(() => {
    MACIFactory.connect = jest.fn().mockImplementation(() => mockMaciContract) as typeof MACIFactory.connect;
    PollFactory.connect = jest.fn().mockImplementation(() => mockPollContract) as typeof PollFactory.connect;

    mockMessageBatchService.saveMessageBatches = jest.fn().mockImplementation((args) => Promise.resolve(args));

    mockRepository.create = jest.fn().mockImplementation(() => Promise.resolve(defaultMessages));
    mockRepository.find = jest.fn().mockImplementation(() => Promise.resolve(defaultMessages));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should save messages properly", async () => {
    const service = new MessageService(
      mockMessageBatchService as unknown as MessageBatchService,
      mockRepository as unknown as MessageRepository,
    );

    const result = await service.saveMessages(defaultSaveMessagesDto);

    expect(result).toStrictEqual(defaultMessages);
  });

  test("should throw an error if can't save messages", async () => {
    const error = new Error("error");

    (mockRepository.create as jest.Mock).mockImplementation(() => Promise.reject(error));

    const service = new MessageService(
      mockMessageBatchService as unknown as MessageBatchService,
      mockRepository as unknown as MessageRepository,
    );

    await expect(service.saveMessages(defaultSaveMessagesDto)).rejects.toThrow(error);
  });

  test("should publish messages properly", async () => {
    const service = new MessageService(
      mockMessageBatchService as unknown as MessageBatchService,
      mockRepository as unknown as MessageRepository,
    );

    const result = await service.publishMessages();

    expect(result).toBe(true);
  });

  test("should not publish messages if there are no any messages", async () => {
    mockRepository.find = jest.fn().mockImplementation(() => Promise.resolve([]));

    const service = new MessageService(
      mockMessageBatchService as unknown as MessageBatchService,
      mockRepository as unknown as MessageRepository,
    );

    const result = await service.publishMessages();

    expect(result).toBe(false);
  });

  test("should throw an error if can't save message batch", async () => {
    const error = new Error("error");

    (mockMessageBatchService.saveMessageBatches as jest.Mock).mockImplementation(() => Promise.reject(error));

    const service = new MessageService(
      mockMessageBatchService as unknown as MessageBatchService,
      mockRepository as unknown as MessageRepository,
    );

    await expect(service.publishMessages()).rejects.toThrow(error);
  });
});
