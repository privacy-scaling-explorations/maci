import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { SNARK_FIELD_SIZE } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

import { circomkitInstance, getSignal } from "./utils/utils";

describe("Public key derivation circuit", function test() {
  this.timeout(90000);

  let circuit: WitnessTester<["privKey"], ["pubKey"]>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("privToPubKey", {
      file: "privToPubKey",
      template: "PrivToPubKey",
    });
  });

  it("should correctly compute a public key", async () => {
    const keypair = new Keypair();

    const circuitInputs = {
      privKey: keypair.privKey.asCircuitInputs() as unknown as bigint,
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const derivedPubkey0 = await getSignal(circuit, witness, "pubKey[0]");
    const derivedPubkey1 = await getSignal(circuit, witness, "pubKey[1]");
    expect(derivedPubkey0.toString()).to.be.eq(keypair.pubKey.rawPubKey[0].toString());
    expect(derivedPubkey1.toString()).to.be.eq(keypair.pubKey.rawPubKey[1].toString());
  });

  it("should produce an output that is within the baby jubjub curve", async () => {
    const keypair = new Keypair();

    const circuitInputs = {
      privKey: keypair.privKey.asCircuitInputs() as unknown as bigint,
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const derivedPubkey0 = await getSignal(circuit, witness, "pubKey[0]");
    const derivedPubkey1 = await getSignal(circuit, witness, "pubKey[1]");
    expect(derivedPubkey0 < SNARK_FIELD_SIZE).to.eq(true);
    expect(derivedPubkey1 < SNARK_FIELD_SIZE).to.eq(true);
  });
});
