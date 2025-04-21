import { generatePublicKey } from "@maci-protocol/crypto";
import { PublicKey, PrivateKey } from "@maci-protocol/domainobjs";

import { generateKeypair } from "../keypair";

describe("generateKeypair", () => {
  it("should output a random private key and public key", () => {
    const keypair1 = generateKeypair();
    const keypair2 = generateKeypair({
      seed: 2801240355254658294358555831749515294960721159561923188361445519585440177746075496738285268291285781469276476510188450870897435498492786799730508035869388059n,
    });

    // Invoking the same command twice should result in different private keys
    expect(keypair1.privateKey).not.toBe(keypair2.privateKey);
    expect(keypair1.publicKey).not.toBe(keypair2.publicKey);
    expect(PrivateKey.deserialize(keypair1.privateKey)).toBeInstanceOf(PrivateKey);
    expect(PublicKey.deserialize(keypair1.publicKey)).toBeInstanceOf(PublicKey);
    expect(PrivateKey.deserialize(keypair2.privateKey)).toBeInstanceOf(PrivateKey);
    expect(PublicKey.deserialize(keypair2.publicKey)).toBeInstanceOf(PublicKey);

    const publicKey2 = generatePublicKey(PrivateKey.deserialize(keypair2.privateKey).raw);
    expect(PublicKey.deserialize(keypair2.publicKey).raw[0].toString()).toBe(publicKey2[0].toString());
    expect(PublicKey.deserialize(keypair2.publicKey).raw[1].toString()).toBe(publicKey2[1].toString());
  });
});
