import { jest } from "@jest/globals";

import type { MessageBatchService } from "../../messageBatch/messageBatch.service";
import type { MessageRepository } from "../message.repository";

import { MessageService } from "../message.service";

import { defaultMessages, defaultSaveMessagesArgs } from "./utils";

describe("MessageService", () => {
  const mockMessageBatchService = {
    saveMessageBatches: jest.fn().mockImplementation((args) => Promise.resolve(args)),
  };

  const mockRepository = {
    create: jest.fn().mockImplementation(() => Promise.resolve(defaultMessages)),
    find: jest.fn().mockImplementation(() => Promise.resolve(defaultMessages)),
  };

  beforeEach(() => {
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

    const result = await service.saveMessages(defaultSaveMessagesArgs);

    expect(result).toStrictEqual(defaultMessages);
  });

  test("should throw an error if can't save messages", async () => {
    const error = new Error("error");

    (mockRepository.create as jest.Mock).mockImplementation(() => Promise.reject(error));

    const service = new MessageService(
      mockMessageBatchService as unknown as MessageBatchService,
      mockRepository as unknown as MessageRepository,
    );

    await expect(service.saveMessages(defaultSaveMessagesArgs)).rejects.toThrow(error);
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
