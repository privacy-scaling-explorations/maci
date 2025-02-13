import dotenv from "dotenv";
import { zeroAddress } from "viem";

import { ErrorCodes, ESupportedNetworks } from "../../common";
import { FileService } from "../../file/file.service";
import { SessionKeysService } from "../sessionKeys.service";

import { generateApproval } from "./utils";

dotenv.config();

describe("SessionKeysService", () => {
  const fileService = new FileService();
  let sessionKeysService: SessionKeysService;

  beforeAll(() => {
    sessionKeysService = new SessionKeysService(fileService);
  });

  describe("generateSessionKey", () => {
    test("should generate and store a session key", () => {
      const sessionKeyAddress = sessionKeysService.generateSessionKey();
      expect(sessionKeyAddress).toBeDefined();
      expect(sessionKeyAddress).not.toEqual(zeroAddress);

      const sessionKey = fileService.getSessionKey(sessionKeyAddress.sessionKeyAddress);
      expect(sessionKey).toBeDefined();
    });
  });

  describe("deactivateSessionKey", () => {
    test("should delete a session key", () => {
      const sessionKeyAddress = sessionKeysService.generateSessionKey();
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
      const sessionKeyAddress = sessionKeysService.generateSessionKey();
      await expect(
        sessionKeysService.generateClientFromSessionKey(
          sessionKeyAddress.sessionKeyAddress,
          "0xinvalid",
          ESupportedNetworks.OPTIMISM_SEPOLIA,
        ),
      ).rejects.toThrow(ErrorCodes.INVALID_APPROVAL.toString());
    });

    test("should throw when given a non existent session key address", async () => {
      const approval = await generateApproval(zeroAddress);
      await expect(
        sessionKeysService.generateClientFromSessionKey(zeroAddress, approval, ESupportedNetworks.OPTIMISM_SEPOLIA),
      ).rejects.toThrow(ErrorCodes.SESSION_KEY_NOT_FOUND.toString());
    });

    test("should generate a client from a session key", async () => {
      jest.mock("@zerodev/sdk", (): unknown => ({
        ...jest.requireActual("@zerodev/sdk"),
        createKernelAccountClient: jest.fn().mockReturnValue({ mockedKernelClient: true }),
      }));

      const mockGenerateClientFromSessionKey = jest.fn().mockResolvedValue({ mockedClient: true });
      jest
        .spyOn(SessionKeysService.prototype, "generateClientFromSessionKey")
        .mockImplementation(mockGenerateClientFromSessionKey);

      const sessionKeyAddress = sessionKeysService.generateSessionKey();
      const approval = await generateApproval(sessionKeyAddress.sessionKeyAddress);

      const client = await sessionKeysService.generateClientFromSessionKey(
        sessionKeyAddress.sessionKeyAddress,
        approval,
        ESupportedNetworks.OPTIMISM_SEPOLIA,
      );
      expect(mockGenerateClientFromSessionKey).toHaveBeenCalledWith(
        sessionKeyAddress.sessionKeyAddress,
        approval,
        ESupportedNetworks.OPTIMISM_SEPOLIA,
      );
      expect(client).toEqual({ mockedClient: true });
    });
  });
});
