import dotenv from "dotenv";

import fs from "fs";

import { ErrorCodes } from "../../common";
import { FileService } from "../file.service";

dotenv.config();

describe("FileService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should save session key properly", () => {
    const service = new FileService();

    const sessionKeyAddress = "0x123";
    const sessionKey = "0x456";

    service.storeSessionKey(sessionKey, sessionKeyAddress);

    const storedSessionKey = service.getSessionKey(sessionKeyAddress);

    expect(storedSessionKey).toEqual(sessionKey);
  });

  test("should delete session key properly", () => {
    const service = new FileService();

    const sessionKeyAddress = "0x123";
    const sessionKey = "0x456";

    service.storeSessionKey(sessionKey, sessionKeyAddress);

    service.deleteSessionKey(sessionKeyAddress);

    const deletedSessionKey = service.getSessionKey(sessionKeyAddress);

    expect(deletedSessionKey).toBeUndefined();
  });

  test("should return public key properly", async () => {
    const service = new FileService();

    const { publicKey } = await service.getPublicKey();

    expect(publicKey).toBeDefined();
  });

  test("should return private key properly", async () => {
    const service = new FileService();

    const { privateKey } = await service.getPrivateKey();

    expect(privateKey).toBeDefined();
  });

  test("should return zkey filepaths for tally qv properly", () => {
    const service = new FileService();

    const { zkey, wasm, witgen } = service.getZkeyFilePaths(process.env.COORDINATOR_TALLY_ZKEY_NAME!, true);

    expect(zkey).toBeDefined();
    expect(wasm).toBeDefined();
    expect(witgen).toBeDefined();
  });

  test("should return zkey filepaths for tally non-qv properly", () => {
    const service = new FileService();

    const { zkey, wasm, witgen } = service.getZkeyFilePaths(process.env.COORDINATOR_TALLY_ZKEY_NAME!, false);

    expect(zkey).toBeDefined();
    expect(wasm).toBeDefined();
    expect(witgen).toBeDefined();
  });

  test("should return zkey filepaths for message process qv properly", () => {
    const service = new FileService();

    const { zkey, wasm, witgen } = service.getZkeyFilePaths(process.env.COORDINATOR_MESSAGE_PROCESS_ZKEY_NAME!, true);

    expect(zkey).toBeDefined();
    expect(wasm).toBeDefined();
    expect(witgen).toBeDefined();
  });

  test("should return zkey filepaths for message process non-qv properly", () => {
    const service = new FileService();

    const { zkey, wasm, witgen } = service.getZkeyFilePaths(process.env.COORDINATOR_MESSAGE_PROCESS_ZKEY_NAME!, false);

    expect(zkey).toBeDefined();
    expect(wasm).toBeDefined();
    expect(witgen).toBeDefined();
  });

  test("should throw an error if there are no zkey filepaths", () => {
    const service = new FileService();

    expect(() => service.getZkeyFilePaths("unknown", false)).toThrow(ErrorCodes.FILE_NOT_FOUND.toString());
  });

  test("should throw an error if there are no wasm and witgen filepaths", () => {
    const spyExistsSync = jest.spyOn(fs, "existsSync");
    spyExistsSync.mockReturnValueOnce(true).mockReturnValue(false);

    const service = new FileService();

    expect(() => service.getZkeyFilePaths(process.env.COORDINATOR_MESSAGE_PROCESS_ZKEY_NAME!, false)).toThrow(
      ErrorCodes.FILE_NOT_FOUND.toString(),
    );
  });
});
