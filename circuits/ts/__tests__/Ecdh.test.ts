import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import tester from "circom_tester";
import { stringifyBigInts } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

import path from "path";

import { getSignal } from "./utils/utils";

chai.use(chaiAsPromised);

describe("Public key derivation circuit", () => {
  const circuitPath = path.resolve(__dirname, "../../circom/test", `ecdh_test.circom`);
  let circuit: tester.WasmTester;

  before(async () => {
    circuit = await tester.wasm(circuitPath);
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

  it("should generate the same ECDH key given the same inputs", async () => {
    const keypair = new Keypair();
    const keypair2 = new Keypair();

    const circuitInputs = stringifyBigInts({
      privKey: keypair.privKey.asCircuitInputs(),
      pubKey: keypair2.pubKey.asCircuitInputs(),
    });

    let witness = await circuit.calculateWitness(circuitInputs, true);
    await circuit.checkConstraints(witness);

    const circuitEcdhSharedKey0 = await getSignal(circuit, witness, "sharedKey[0]");
    const circuitEcdhSharedKey1 = await getSignal(circuit, witness, "sharedKey[1]");

    witness = await circuit.calculateWitness(circuitInputs, true);
    await circuit.checkConstraints(witness);

    const circuitEcdhSharedKey02 = await getSignal(circuit, witness, "sharedKey[0]");
    const circuitEcdhSharedKey12 = await getSignal(circuit, witness, "sharedKey[1]");

    expect(circuitEcdhSharedKey0.toString()).to.be.eq(circuitEcdhSharedKey02.toString());
    expect(circuitEcdhSharedKey1.toString()).to.be.eq(circuitEcdhSharedKey12.toString());
  });

  it("should throw when given invalid inputs (pubKey too short)", async () => {
    const keypair = new Keypair();
    const keypair2 = new Keypair();

    const circuitInputs = stringifyBigInts({
      privKey: keypair.privKey.asCircuitInputs(),
      pubKey: keypair2.pubKey.asCircuitInputs().slice(0, 1),
    });

    await expect(circuit.calculateWitness(circuitInputs, true)).to.be.rejectedWith(
      "Not enough values for input signal pubKey",
    );
  });
});
