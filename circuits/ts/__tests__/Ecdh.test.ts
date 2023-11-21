import { stringifyBigInts } from "maci-crypto";
import { Keypair } from "maci-domainobjs";
import { join } from "path";
const tester = require("circom_tester").wasm;
import { expect } from 'chai'
import { getSignal } from './utils/utils';

describe("Public key derivation circuit", () => {
  const circuitPath = join(__dirname, "../../circom/test", `ecdh_test.circom`);
  let circuit: any;

  before(async () => {
    circuit = await tester(circuitPath);
  });

  it("correctly computes a public key", async () => {
    const keypair = new Keypair();
    const keypair2 = new Keypair();

    const ecdhSharedKey = Keypair.genEcdhSharedKey(keypair.privKey, keypair2.pubKey);

    const circuitInputs = stringifyBigInts({
      privKey: keypair.privKey.asCircuitInputs(),
      pubKey: keypair2.pubKey.asCircuitInputs(),
    });

    const witness = await circuit.calculateWitness(circuitInputs, true);
    await circuit.checkConstraints(witness);

    const circuitEcdhSharedKey0 = await getSignal(circuit, witness, "sharedKey[0]");
    const circuitEcdhSharedKey1 = await getSignal(circuit, witness, "sharedKey[1]");
    expect(circuitEcdhSharedKey0.toString()).to.be.eq(ecdhSharedKey[0].toString());
    expect(circuitEcdhSharedKey1.toString()).to.be.eq(ecdhSharedKey[1].toString());
  });
});
