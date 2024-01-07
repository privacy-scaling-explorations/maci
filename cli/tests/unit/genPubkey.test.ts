import { expect } from "chai";
import { genPubKey } from "maci-crypto";
import { PubKey, PrivKey } from "maci-domainobjs";

import { genKeyPair, genMaciPubKey } from "../../ts";

describe("genMaciPubkey CLI subcommand", () => {
  it("should output a valid public key", () => {
    const keypair = genKeyPair(true);
    const pubKey = genMaciPubKey(keypair.privateKey, true);

    expect(pubKey).to.eq(keypair.publicKey);

    const unserialisedPrivkey = PrivKey.deserialize(keypair.privateKey);
    const pk2 = genPubKey(unserialisedPrivkey.rawPrivKey);
    const unserializedPk = PubKey.deserialize(keypair.publicKey);
    expect(unserializedPk.rawPubKey[0].toString()).to.eq(pk2[0].toString());
    expect(unserializedPk.rawPubKey[1].toString()).to.eq(pk2[1].toString());
  });

  it("should throw when given an invalid private key", () => {
    expect(() => genMaciPubKey("invalid", true)).to.throw("Invalid private key");
  });
});
