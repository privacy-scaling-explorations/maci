import { expect } from "chai";
import tester from "circom_tester";
import { SNARK_FIELD_SIZE, stringifyBigInts } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

import path from "path";

import { getSignal } from "./utils/utils";

describe("Public key derivation circuit", function test() {
  this.timeout(90000);
  let circuit: tester.WasmTester;

  before(async () => {
    const circuitPath = path.resolve(__dirname, "../../circom/test", `privToPubKey_test.circom`);
    circuit = await tester.wasm(circuitPath);
  });

  it("should correctly compute a public key", async () => {
    const keypair = new Keypair();

    const circuitInputs = stringifyBigInts({
      privKey: keypair.privKey.asCircuitInputs(),
    });

    const witness = await circuit.calculateWitness(circuitInputs, true);
    await circuit.checkConstraints(witness);

    const derivedPubkey0 = await getSignal(circuit, witness, "pubKey[0]");
    const derivedPubkey1 = await getSignal(circuit, witness, "pubKey[1]");
    expect(derivedPubkey0.toString()).to.be.eq(keypair.pubKey.rawPubKey[0].toString());
    expect(derivedPubkey1.toString()).to.be.eq(keypair.pubKey.rawPubKey[1].toString());
  });

  it("should produce an output that is within the baby jubjub curve", async () => {
    const keypair = new Keypair();

    const circuitInputs = stringifyBigInts({
      privKey: keypair.privKey.asCircuitInputs(),
    });

    const witness = await circuit.calculateWitness(circuitInputs, true);
    await circuit.checkConstraints(witness);

    const derivedPubkey0 = await getSignal(circuit, witness, "pubKey[0]");
    const derivedPubkey1 = await getSignal(circuit, witness, "pubKey[1]");
    expect(derivedPubkey0 < SNARK_FIELD_SIZE).to.eq(true);
    expect(derivedPubkey1 < SNARK_FIELD_SIZE).to.eq(true);
  });
});
