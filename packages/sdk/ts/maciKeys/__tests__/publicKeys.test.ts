import { generatePublicKey } from "@maci-protocol/crypto";
import { PublicKey, PrivateKey } from "@maci-protocol/domainobjs";

import { generateKeypair } from "../keypair";
import { generateMaciPublicKey } from "../publicKeys";

describe("generateMaciPublicKey", () => {
  test("should output a valid public key", () => {
    const keypair = generateKeypair();
    const publicKey = generateMaciPublicKey(keypair.privateKey);

    expect(publicKey).toBe(keypair.publicKey);

    const unserialisedPrivate = PrivateKey.deserialize(keypair.privateKey);
    const publicKey2 = generatePublicKey(unserialisedPrivate.raw);
    const unserializedPublicKey = PublicKey.deserialize(keypair.publicKey);
    expect(unserializedPublicKey.raw[0].toString()).toBe(publicKey2[0].toString());
    expect(unserializedPublicKey.raw[1].toString()).toBe(publicKey2[1].toString());
  });

  test("should throw when given an invalid private key", () => {
    expect(() => generateMaciPublicKey("invalid")).toThrow("Invalid private key");
  });
});
