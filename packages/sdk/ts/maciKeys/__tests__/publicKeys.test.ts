import { genPubKey } from "@maci-protocol/crypto";
import { PublicKey, PrivateKey } from "@maci-protocol/domainobjs";

import { generateKeypair } from "../keypair";
import { generateMaciPublicKey } from "../publicKeys";

describe("generateMaciPublicKey", () => {
  test("should output a valid public key", () => {
    const keypair = generateKeypair();
    const publicKey = generateMaciPublicKey(keypair.privateKey);

    expect(publicKey).toBe(keypair.publicKey);

    const unserialisedPrivkey = PrivateKey.deserialize(keypair.privateKey);
    const pk2 = genPubKey(unserialisedPrivkey.rawPrivKey);
    const unserializedPk = PublicKey.deserialize(keypair.publicKey);
    expect(unserializedPk.rawPubKey[0].toString()).toBe(pk2[0].toString());
    expect(unserializedPk.rawPubKey[1].toString()).toBe(pk2[1].toString());
  });

  test("should throw when given an invalid private key", () => {
    expect(() => generateMaciPublicKey("invalid")).toThrow("Invalid private key");
  });
});
