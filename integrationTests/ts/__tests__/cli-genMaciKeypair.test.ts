import { PubKey, PrivKey } from "maci-domainobjs";

import { genPubKey } from "maci-crypto";
import { expect } from "chai";
import { exec } from "./utils";

describe("genMaciKeypair CLI subcommand", function () {
  this.timeout(100000);
  const command = "node ../cli/build/index.js genMaciKeypair";

  it("genMaciKeypair should output a random private key and public key", async () => {
    const output = exec(command).stdout;
    const output2 = exec(command).stdout;

    const lines = output.split("\n");
    const lines2 = output2.split("\n");

    // Invoking the same command twice should result in different private
    // keys
    expect(lines[0]).not.to.eq(lines2[0]);

    const sk = PrivKey.unserialize(lines[0].split(" ")[2]);
    expect(sk instanceof PrivKey).to.be.true;

    const pk = PubKey.unserialize(lines[1].split(" ")[3]);
    expect(pk instanceof PubKey).to.be.true;

    const pk2 = genPubKey(sk.rawPrivKey);
    expect(pk.rawPubKey[0].toString()).to.eq(pk2[0].toString());
    expect(pk.rawPubKey[1].toString()).to.eq(pk2[1].toString());
  });
});
