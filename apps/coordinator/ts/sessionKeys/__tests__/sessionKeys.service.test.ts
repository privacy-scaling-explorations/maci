import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk";
import dotenv from "dotenv";
import { zeroAddress } from "viem";

import { ErrorCodes, ESupportedNetworks } from "../../common";
import { FileService } from "../../file/file.service";
import { SessionKeysService } from "../sessionKeys.service";

import { generateApproval } from "./utils";

dotenv.config();

jest.mock("@zerodev/sdk", (): unknown => ({
  ...jest.requireActual("@zerodev/sdk"),
  createKernelAccount: jest.fn(),
  createKernelAccountClient: jest.fn(),
}));

jest.mock("@zerodev/permissions", (): unknown => ({
  ...jest.requireActual("@zerodev/permissions"),
  serializePermissionAccount: jest.fn().mockResolvedValue("approval"),
  deserializePermissionAccount: jest.fn().mockResolvedValue({}),
}));

describe("SessionKeysService", () => {
  const fileService = new FileService();
  const mockedKernelAccount = { mockedAccount: true };
  const mockedKernelAccountClient = { mockedAccountClient: true };

  beforeEach(() => {
    (createKernelAccount as jest.Mock).mockResolvedValue(mockedKernelAccount);

    (createKernelAccountClient as jest.Mock).mockResolvedValue(mockedKernelAccountClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateSessionKey", () => {
    test("should generate and store a session key", async () => {
      const sessionKeysService = new SessionKeysService(fileService);

      const sessionKeyAddress = await sessionKeysService.generateSessionKey();
      expect(sessionKeyAddress).toBeDefined();
      expect(sessionKeyAddress).not.toEqual(zeroAddress);

      const sessionKey = fileService.getSessionKey(sessionKeyAddress.sessionKeyAddress);
      expect(sessionKey).toBeDefined();
    });
  });

  describe("deactivateSessionKey", () => {
    test("should delete a session key", async () => {
      const sessionKeysService = new SessionKeysService(fileService);

      const sessionKeyAddress = await sessionKeysService.generateSessionKey();
      expect(sessionKeyAddress).toBeDefined();
      expect(sessionKeyAddress).not.toEqual(zeroAddress);

      const sessionKey = fileService.getSessionKey(sessionKeyAddress.sessionKeyAddress);
      expect(sessionKey).toBeDefined();

      sessionKeysService.deactivateSessionKey(sessionKeyAddress.sessionKeyAddress);
      const sessionKeyDeleted = fileService.getSessionKey(sessionKeyAddress.sessionKeyAddress);
      expect(sessionKeyDeleted).toBeUndefined();
    });
  });

  describe("generateClientFromSessionKey", () => {
    test("should fail to generate a client with an invalid approval", async () => {
      (createKernelAccountClient as jest.Mock).mockRejectedValue(new Error());

      const sessionKeysService = new SessionKeysService(fileService);

      const sessionKeyAddress = await sessionKeysService.generateSessionKey();
      await expect(
        sessionKeysService.generateClientFromSessionKey(
          sessionKeyAddress.sessionKeyAddress,
          "0xinvalid",
          ESupportedNetworks.OPTIMISM_SEPOLIA,
        ),
      ).rejects.toThrow(ErrorCodes.INVALID_APPROVAL.toString());
    });

    test("should throw when given a non existent session key address", async () => {
      const sessionKeysService = new SessionKeysService(fileService);

      const approval = await generateApproval(zeroAddress);
      await expect(
        sessionKeysService.generateClientFromSessionKey(zeroAddress, approval, ESupportedNetworks.OPTIMISM_SEPOLIA),
      ).rejects.toThrow(ErrorCodes.SESSION_KEY_NOT_FOUND.toString());
    });

    test("should generate a client from a session key", async () => {
      const sessionKeysService = new SessionKeysService(fileService);

      const { sessionKeyAddress } = await sessionKeysService.generateSessionKey();
      const approval = await generateApproval(sessionKeyAddress);
      const client = await sessionKeysService.generateClientFromSessionKey(
        sessionKeyAddress,
        approval,
        ESupportedNetworks.OPTIMISM_SEPOLIA,
      );

      expect(createKernelAccountClient).toHaveBeenCalledTimes(1);
      expect(client).toEqual(mockedKernelAccountClient);
    });
  });
});
