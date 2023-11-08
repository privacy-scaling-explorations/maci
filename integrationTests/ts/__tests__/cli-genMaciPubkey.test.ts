import {
    PubKey,
    PrivKey,
} from 'maci-domainobjs'
import { 
    genPubKey,
} from 'maci-crypto'
import { genKeyPair, genMaciPubKey } from 'maci-cli/ts/commands'

describe('genMaciPubkey CLI subcommand', () => {
    it('genMaciPubkey should output a correct public key', async () => {
        const keypair = genKeyPair({ quiet: true })
        const pubKey = genMaciPubKey({ privkey: keypair.privateKey, quiet: true })
     
        expect(pubKey).toEqual(keypair.publicKey)

<<<<<<< HEAD
describe("genMaciPubkey CLI subcommand", function () {
  this.timeout(100000);
  const command = "node ../cli/build/index.js genMaciKeypair";

  it("genMaciPubkey should output a correct public key", async () => {
    const output = exec(command).stdout;
    const lines = output.split("\n");

    const sk = lines[0].split(" ")[2];
    const pk = lines[1].split(" ")[3];

    const command2 = "node ../cli/build/index.js genMaciPubkey -sk " + sk;
    const output2 = exec(command2).stdout.trim();

    expect(output2).to.eq(pk);

    const unserialisedPrivkey = PrivKey.deserialize(sk);
    const pk2 = genPubKey(unserialisedPrivkey.rawPrivKey);
    const unserializedPk = PubKey.deserialize(pk);
    expect(unserializedPk.rawPubKey[0].toString()).to.eq(pk2[0].toString());
    expect(unserializedPk.rawPubKey[1].toString()).to.eq(pk2[1].toString());
  });
});
=======
        const unserialisedPrivkey = PrivKey.deserialize(keypair.privateKey)
        const pk2 = genPubKey(unserialisedPrivkey.rawPrivKey)
        const unserializedPk = PubKey.deserialize(keypair.publicKey)
        expect(unserializedPk.rawPubKey[0].toString()).toEqual(pk2[0].toString())
        expect(unserializedPk.rawPubKey[1].toString()).toEqual(pk2[1].toString())
    })
})
>>>>>>> 401983e3 (refactoring(integration-tests) - refactor integration tests)
