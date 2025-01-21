import { jest } from "@jest/globals";
import { ZeroAddress } from "ethers";
import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "maci-contracts";

import { IpfsService } from "../../ipfs/ipfs.service";
import { MessageBatchDto } from "../dto";
import { MessageBatchRepository } from "../messageBatch.repository";
import { MessageBatchService } from "../messageBatch.service";

import { defaultIpfsHash, defaultMessageBatches } from "./utils";

jest.mock("maci-contracts", (): unknown => ({
  MACI__factory: {
    connect: jest.fn(),
  },
  Poll__factory: {
    connect: jest.fn(),
  },
}));

describe("MessageBatchService", () => {
  const mockIpfsService = {
    add: jest.fn().mockImplementation(() => Promise.resolve(defaultIpfsHash)),
  };

  const mockRepository = {
    create: jest.fn().mockImplementation(() => Promise.resolve(defaultMessageBatches)),
  };

  const mockMaciContract = {
    polls: jest.fn().mockImplementation(() => Promise.resolve({ poll: ZeroAddress })),
  };

  const mockPollContract = {
    hashMessageAndEncPubKey: jest.fn().mockImplementation(() => Promise.resolve("hash")),
    relayMessagesBatch: jest
      .fn()
      .mockImplementation(() => Promise.resolve({ wait: jest.fn().mockImplementation(() => Promise.resolve()) })),
  };

  beforeEach(() => {
    mockRepository.create = jest.fn().mockImplementation(() => Promise.resolve(defaultMessageBatches));
    mockIpfsService.add = jest.fn().mockImplementation(() => Promise.resolve(defaultIpfsHash));

    MACIFactory.connect = jest.fn().mockImplementation(() => mockMaciContract) as typeof MACIFactory.connect;
    PollFactory.connect = jest.fn().mockImplementation(() => mockPollContract) as typeof PollFactory.connect;
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
    expect(mockPollContract.relayMessagesBatch).toHaveBeenCalledTimes(1);
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
