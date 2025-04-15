import { genPubKey } from "@maci-protocol/crypto";
import { PubKey, PrivKey } from "@maci-protocol/domainobjs";

import { generateKeypair } from "../keypair";
import { generateMaciPublicKey } from "../publicKeys";

describe("generateMaciPublicKey", () => {
  test("should output a valid public key", () => {
    const keypair = generateKeypair();
    const pubKey = generateMaciPublicKey(keypair.privateKey);

    expect(pubKey).toBe(keypair.publicKey);

    const unserialisedPrivkey = PrivKey.deserialize(keypair.privateKey);
    const pk2 = genPubKey(unserialisedPrivkey.rawPrivKey);
    const unserializedPk = PubKey.deserialize(keypair.publicKey);
    expect(unserializedPk.rawPubKey[0].toString()).toBe(pk2[0].toString());
    expect(unserializedPk.rawPubKey[1].toString()).toBe(pk2[1].toString());
  });

  test("should throw when given an invalid private key", () => {
    expect(() => generateMaciPublicKey("invalid")).toThrow("Invalid private key");
  });
});
