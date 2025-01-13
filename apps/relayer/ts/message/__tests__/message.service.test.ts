import type { MessageBatchService } from "../../messageBatch/messageBatch.service";
import type { MessageRepository } from "../message.repository";

import { MessageService } from "../message.service";

import { defaultMessages, defaultSaveMessagesArgs } from "./utils";

describe("MessageService", () => {
  const mockMessageBatchService = {
    saveMessageBatches: jest.fn().mockImplementation((args) => Promise.resolve(args)),
  } as unknown as MessageBatchService;

  const mockRepository = {
    create: jest.fn().mockResolvedValue(defaultMessages),
    find: jest.fn().mockResolvedValue(defaultMessages),
  } as unknown as MessageRepository;

  beforeEach(() => {
    mockMessageBatchService.saveMessageBatches = jest.fn().mockImplementation((args) => Promise.resolve(args));

    mockRepository.create = jest.fn().mockResolvedValue(defaultMessages);
    mockRepository.find = jest.fn().mockResolvedValue(defaultMessages);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should save messages properly", async () => {
    const service = new MessageService(mockMessageBatchService, mockRepository);

    const result = await service.saveMessages(defaultSaveMessagesArgs);

    expect(result).toStrictEqual(defaultMessages);
  });

  test("should throw an error if can't save messages", async () => {
    const error = new Error("error");

    (mockRepository.create as jest.Mock).mockRejectedValue(error);

    const service = new MessageService(mockMessageBatchService, mockRepository);

    await expect(service.saveMessages(defaultSaveMessagesArgs)).rejects.toThrow(error);
  });

  test("should publish messages properly", async () => {
    const service = new MessageService(mockMessageBatchService, mockRepository);

    const result = await service.publishMessages();

    expect(result).toStrictEqual({ hash: "", ipfsHash: "" });
  });

  test("should throw an error if can't save message batch", async () => {
    const error = new Error("error");

    (mockMessageBatchService.saveMessageBatches as jest.Mock).mockRejectedValue(error);

    const service = new MessageService(mockMessageBatchService, mockRepository);

    await expect(service.publishMessages()).rejects.toThrow(error);
  });
});
