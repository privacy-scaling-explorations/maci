import { jest } from "@jest/globals";
import { HttpException, HttpStatus } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { MessageController } from "../message.controller";
import { MessageService } from "../message.service";

import { defaultSaveMessagesArgs } from "./utils";

describe("MessageController", () => {
  let controller: MessageController;

  const mockMessageService = {
    saveMessages: jest.fn(),
    merge: jest.fn(),
  };

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      controllers: [MessageController],
    })
      .useMocker((token) => {
        if (token === MessageService) {
          mockMessageService.saveMessages.mockImplementation(() => Promise.resolve(true));

          return mockMessageService;
        }

        return jest.fn();
      })
      .compile();

    controller = app.get<MessageController>(MessageController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("v1/messages/publish", () => {
    test("should publish user messages properly", async () => {
      const data = await controller.publish(defaultSaveMessagesArgs);

      expect(data).toBe(true);
    });

    test("should throw an error if messages saving is failed", async () => {
      const error = new Error("error");
      mockMessageService.saveMessages.mockImplementation(() => Promise.reject(error));

      await expect(controller.publish(defaultSaveMessagesArgs)).rejects.toThrow(
        new HttpException(error.message, HttpStatus.BAD_REQUEST),
      );
    });
  });
});
