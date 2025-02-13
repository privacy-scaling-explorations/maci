import fc from "fast-check";

import { generateKeyPairSync } from "crypto";

import { ErrorCodes } from "../../common";
import { CryptoService } from "../crypto.service";

describe("CryptoService", () => {
  test("should throw encryption error if key is invalid", () => {
    const service = new CryptoService();

    expect(() => service.encrypt("", "")).toThrow(ErrorCodes.ENCRYPTION.toString());
  });

  test("should throw decryption error if key is invalid", () => {
    const service = new CryptoService();

    expect(() => service.decrypt("", "")).toThrow(ErrorCodes.DECRYPTION.toString());
  });

  test("should encrypt and decrypt properly", () => {
    fc.assert(
      fc.property(fc.string(), (text: string) => {
        const service = new CryptoService();

        const keypair = generateKeyPairSync("rsa", {
          modulusLength: 2048,
        });

        const encryptedText = service.encrypt(keypair.publicKey.export({ type: "pkcs1", format: "pem" }), text);

        const decryptedText = service.decrypt(
          keypair.privateKey.export({ type: "pkcs1", format: "pem" }),
          encryptedText,
        );

        return decryptedText === text;
      }),
    );
  });
});
