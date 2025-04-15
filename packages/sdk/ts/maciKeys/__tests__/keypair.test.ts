import { genPubKey } from "@maci-protocol/crypto";
import { PubKey, PrivKey } from "@maci-protocol/domainobjs";

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
    expect(PrivKey.deserialize(keypair1.privateKey)).toBeInstanceOf(PrivKey);
    expect(PubKey.deserialize(keypair1.publicKey)).toBeInstanceOf(PubKey);
    expect(PrivKey.deserialize(keypair2.privateKey)).toBeInstanceOf(PrivKey);
    expect(PubKey.deserialize(keypair2.publicKey)).toBeInstanceOf(PubKey);

    const publicKey2 = genPubKey(PrivKey.deserialize(keypair2.privateKey).rawPrivKey);
    expect(PubKey.deserialize(keypair2.publicKey).rawPubKey[0].toString()).toBe(publicKey2[0].toString());
    expect(PubKey.deserialize(keypair2.publicKey).rawPubKey[1].toString()).toBe(publicKey2[1].toString());
  });
});
