import { expect } from "chai";
import { genPubKey } from "maci-crypto";
import { PubKey, PrivKey } from "maci-domainobjs";

import { genKeyPair } from "../../ts";

describe("genMaciKeypair CLI subcommand", () => {
  it("genMaciKeypair should output a random private key and public key", () => {
    const keypair1 = genKeyPair({ quiet: true });
    const keypair2 = genKeyPair({
      seed: 2801240355254658294358555831749515294960721159561923188361445519585440177746075496738285268291285781469276476510188450870897435498492786799730508035869388059n,
      quiet: true,
    });

    // Invoking the same command twice should result in different private keys
    expect(keypair1.privateKey).not.to.eq(keypair2.privateKey);
    expect(keypair1.publicKey).not.to.eq(keypair2.publicKey);
    expect(PrivKey.deserialize(keypair1.privateKey)).to.be.instanceOf(PrivKey);
    expect(PubKey.deserialize(keypair1.publicKey)).to.be.instanceOf(PubKey);
    expect(PrivKey.deserialize(keypair2.privateKey)).to.be.instanceOf(PrivKey);
    expect(PubKey.deserialize(keypair2.publicKey)).to.be.instanceOf(PubKey);

    const publicKey2 = genPubKey(PrivKey.deserialize(keypair2.privateKey).rawPrivKey);
    expect(PubKey.deserialize(keypair2.publicKey).rawPubKey[0].toString()).to.eq(publicKey2[0].toString());
    expect(PubKey.deserialize(keypair2.publicKey).rawPubKey[1].toString()).to.eq(publicKey2[1].toString());
  });
});
