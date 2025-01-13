import { jest } from "@jest/globals";

import { IpfsService } from "../../ipfs/ipfs.service";
import { MessageBatchDto } from "../dto";
import { MessageBatchRepository } from "../messageBatch.repository";
import { MessageBatchService } from "../messageBatch.service";

import { defaultIpfsHash, defaultMessageBatches } from "./utils";

describe("MessageBatchService", () => {
  const mockIpfsService = {
    add: jest.fn().mockImplementation(() => Promise.resolve(defaultIpfsHash)),
  };

  const mockRepository = {
    create: jest.fn().mockImplementation(() => Promise.resolve(defaultMessageBatches)),
  };

  beforeEach(() => {
    mockRepository.create = jest.fn().mockImplementation(() => Promise.resolve(defaultMessageBatches));
    mockIpfsService.add = jest.fn().mockImplementation(() => Promise.resolve(defaultIpfsHash));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should save message batches properly", async () => {
    const service = new MessageBatchService(
      mockIpfsService as unknown as IpfsService,
      mockRepository as unknown as MessageBatchRepository,
    );

    const result = await service.saveMessageBatches(defaultMessageBatches);

    expect(result).toStrictEqual(defaultMessageBatches);
  });

  test("should throw an error if can't save message batches", async () => {
    const error = new Error("error");

    (mockRepository.create as jest.Mock).mockImplementation(() => Promise.reject(error));

    const service = new MessageBatchService(
      mockIpfsService as unknown as IpfsService,
      mockRepository as unknown as MessageBatchRepository,
    );

    await expect(service.saveMessageBatches(defaultMessageBatches)).rejects.toThrow(error);
  });

  test("should throw an error if can't update message batches to ipfs", async () => {
    const error = new Error("error");

    (mockIpfsService.add as jest.Mock).mockImplementation(() => Promise.reject(error));

    const service = new MessageBatchService(
      mockIpfsService as unknown as IpfsService,
      mockRepository as unknown as MessageBatchRepository,
    );

    await expect(service.saveMessageBatches(defaultMessageBatches)).rejects.toThrow(error);
  });

  test("should throw an error if validation is failed", async () => {
    const service = new MessageBatchService(
      mockIpfsService as unknown as IpfsService,
      mockRepository as unknown as MessageBatchRepository,
    );

    const invalidEmptyMessagesArgs = new MessageBatchDto();
    invalidEmptyMessagesArgs.messages = [];
    invalidEmptyMessagesArgs.ipfsHash = "invalid";

    const invalidMessageArgs = new MessageBatchDto();
    invalidMessageArgs.messages = [];
    invalidMessageArgs.ipfsHash = "invalid";

    await expect(service.saveMessageBatches([invalidEmptyMessagesArgs])).rejects.toThrow("Validation error");
    await expect(service.saveMessageBatches([invalidMessageArgs])).rejects.toThrow("Validation error");
  });
});
