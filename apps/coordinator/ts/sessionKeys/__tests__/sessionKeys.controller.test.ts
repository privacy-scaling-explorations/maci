import { Test } from "@nestjs/testing";
import { zeroAddress } from "viem";

import type { IGenerateSessionKeyReturn } from "../types";

import { SessionKeysController } from "../sessionKeys.controller";
import { SessionKeysService } from "../sessionKeys.service";

describe("SessionKeysController", () => {
  let sessionKeysController: SessionKeysController;

  const mockSessionKeysService = {
    generateSessionKey: jest.fn(),
    deactivateSessionKey: jest.fn(),
  };

  const defaultGenerateSessionKeyReturn: IGenerateSessionKeyReturn = {
    sessionKeyAddress: zeroAddress,
  };

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      controllers: [SessionKeysController],
    })
      .useMocker((token) => {
        if (token === SessionKeysService) {
          mockSessionKeysService.generateSessionKey.mockResolvedValue(defaultGenerateSessionKeyReturn);
          return mockSessionKeysService;
        }

        return jest.fn();
      })
      .compile();

    sessionKeysController = app.get<SessionKeysController>(SessionKeysController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("v1/session-keys/generate", () => {
    test("should return a session key address", () => {
      const data = sessionKeysController.generateSessionKey();
      expect(data).toStrictEqual(defaultGenerateSessionKeyReturn);
    });
  });

  describe("v1/session-keys/delete", () => {
    test("should delete a session key", () => {
      sessionKeysController.deactivateSessionKey({ sessionKeyAddress: zeroAddress });
      expect(mockSessionKeysService.deactivateSessionKey).toHaveBeenCalledWith(zeroAddress);
    });
  });
});
