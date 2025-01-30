import { jest } from "@jest/globals";
import { HttpException, HttpStatus } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { MessageBatchController } from "../messageBatch.controller";
import { MessageBatchService } from "../messageBatch.service";

import { defaultGetMessageBatchesDto, defaultMessageBatches } from "./utils";

describe("MessageBatchController", () => {
  let controller: MessageBatchController;

  const mockMessageBatchService = {
    findMessageBatches: jest.fn(),
  };

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      controllers: [MessageBatchController],
    })
      .useMocker((token) => {
        if (token === MessageBatchService) {
          mockMessageBatchService.findMessageBatches.mockImplementation(() => Promise.resolve(defaultMessageBatches));

          return mockMessageBatchService;
        }

        return jest.fn();
      })
      .compile();

    controller = app.get<MessageBatchController>(MessageBatchController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("v1/messageBatches/get", () => {
    test("should get message batches properly", async () => {
      const data = await controller.get(defaultGetMessageBatchesDto);

      expect(data).toStrictEqual(defaultMessageBatches);
    });

    test("should throw an error if fetching is failed", async () => {
      const error = new Error("error");
      mockMessageBatchService.findMessageBatches.mockImplementation(() => Promise.reject(error));

      await expect(controller.get(defaultGetMessageBatchesDto)).rejects.toThrow(
        new HttpException(error.message, HttpStatus.BAD_REQUEST),
      );
    });
  });
});
