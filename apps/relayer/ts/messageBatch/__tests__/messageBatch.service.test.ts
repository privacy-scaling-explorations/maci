import { MessageBatchDto } from "../dto";
import { MessageBatchRepository } from "../messageBatch.repository";
import { MessageBatchService } from "../messageBatch.service";

import { defaultMessageBatches } from "./utils";

describe("MessageBatchService", () => {
  const mockRepository = {
    create: jest.fn().mockResolvedValue(defaultMessageBatches),
  } as unknown as MessageBatchRepository;

  beforeEach(() => {
    mockRepository.create = jest.fn().mockResolvedValue(defaultMessageBatches);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should save message batches properly", async () => {
    const service = new MessageBatchService(mockRepository);

    const result = await service.saveMessageBatches(defaultMessageBatches);

    expect(result).toStrictEqual(defaultMessageBatches);
  });

  test("should throw an error if can't save message batches", async () => {
    const error = new Error("error");

    (mockRepository.create as jest.Mock).mockRejectedValue(error);

    const service = new MessageBatchService(mockRepository);

    await expect(service.saveMessageBatches(defaultMessageBatches)).rejects.toThrow(error);
  });

  test("should throw an error if validation is failed", async () => {
    const service = new MessageBatchService(mockRepository);

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
