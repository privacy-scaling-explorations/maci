import { Model } from "mongoose";

import { MessageBatchRepository } from "../messageBatch.repository";
import { MessageBatch } from "../messageBatch.schema";

import { defaultMessageBatches } from "./utils";

describe("MessageBatchRepository", () => {
  const mockMessageBatchModel = {
    find: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([defaultMessageBatches]) }),
    }),
    insertMany: jest.fn().mockResolvedValue(defaultMessageBatches),
  } as unknown as Model<MessageBatch>;

  beforeEach(() => {
    mockMessageBatchModel.find = jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([defaultMessageBatches]) }),
    });
    mockMessageBatchModel.insertMany = jest.fn().mockResolvedValue(defaultMessageBatches);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should create message batch properly", async () => {
    const repository = new MessageBatchRepository(mockMessageBatchModel);

    const result = await repository.create(defaultMessageBatches);

    expect(result).toStrictEqual(defaultMessageBatches);
  });

  test("should throw an error if creation is failed", async () => {
    const error = new Error("error");

    (mockMessageBatchModel.insertMany as jest.Mock).mockRejectedValue(error);

    const repository = new MessageBatchRepository(mockMessageBatchModel);

    await expect(repository.create(defaultMessageBatches)).rejects.toThrow(error);
  });

  test("should find message batches properly", async () => {
    const repository = new MessageBatchRepository(mockMessageBatchModel);

    const result = await repository.find({});

    expect(result).toStrictEqual([defaultMessageBatches]);
  });

  test("should throw an error if find is failed", async () => {
    const error = new Error("error");

    (mockMessageBatchModel.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(error),
      }),
    });

    const repository = new MessageBatchRepository(mockMessageBatchModel);

    await expect(repository.find({})).rejects.toThrow(error);
  });
});
