import fc from "fast-check";

import { generateKeyPairSync } from "crypto";

import { CryptoService } from "../crypto.service";

describe("CryptoService", () => {
  test("should encrypt and decrypt properly", () => {
    fc.assert(
      fc.property(fc.string(), (text: string) => {
        const service = CryptoService.getInstance();

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
