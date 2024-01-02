import { expect } from "chai";
import tester from "circom_tester";
import { stringifyBigInts, verifySignature, hash4 } from "maci-crypto";
import { Keypair, PCommand } from "maci-domainobjs";

import path from "path";

import { getSignal } from "./utils/utils";

describe("Signature verification circuit", function test() {
  this.timeout(90000);

  let circuit: tester.WasmTester;
  before(async () => {
    const circuitPath = path.resolve(__dirname, "../../circom/test", `verifySignature_test.circom`);
    circuit = await tester.wasm(circuitPath);
  });

  it("verifies a valid signature", async () => {
    const keypair = new Keypair();
    const command = new PCommand(BigInt(0), keypair.pubKey, BigInt(123), BigInt(123), BigInt(1), BigInt(2), BigInt(3));

    const signer = new Keypair();
    const sig = command.sign(signer.privKey);
    const plaintext = hash4(command.asArray());

    expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).to.eq(true);

    const circuitInputs = stringifyBigInts({
      pubKey: signer.pubKey.asCircuitInputs(),
      R8: sig.R8,
      S: sig.S,
      preimage: command.asCircuitInputs(),
    });

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "valid");
    expect(isValid.toString()).to.be.eq("1");
  });

  it("rejects an invalid signature (wrong signer)", async () => {
    const keypair = new Keypair();
    const command = new PCommand(BigInt(0), keypair.pubKey, BigInt(123), BigInt(123), BigInt(1), BigInt(2), BigInt(3));

    const signer = new Keypair();
    const wrongSigner = new Keypair();

    expect(signer.privKey.rawPrivKey).not.to.be.eq(wrongSigner.privKey.rawPrivKey);

    const sig = command.sign(signer.privKey);

    const plaintext = hash4(command.asArray());

    // The signature is signed by `signer`
    expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).to.eq(true);

    // The signature is not signed by `wrongSigner`
    expect(verifySignature(plaintext, sig, wrongSigner.pubKey.rawPubKey)).to.eq(false);

    const circuitInputs = stringifyBigInts({
      pubKey: wrongSigner.pubKey.asCircuitInputs(),
      R8: sig.R8,
      S: sig.S,
      preimage: command.asCircuitInputs(),
    });

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "valid");
    expect(isValid.toString()).to.be.eq("0");
    expect((await getSignal(circuit, witness, "verifier.isCcZero.out")).toString()).to.be.eq("1");
  });

  it("rejects an invalid signature", async () => {
    const keypair = new Keypair();
    const command = new PCommand(BigInt(0), keypair.pubKey, BigInt(123), BigInt(123), BigInt(1), BigInt(2), BigInt(3));

    const signer = new Keypair();
    const sig = command.sign(signer.privKey);
    const plaintext = hash4(command.asArray());

    expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).to.eq(true);

    const circuitInputs = stringifyBigInts({
      pubKey: signer.pubKey.asCircuitInputs(),
      R8: sig.R8,
      S: BigInt("2736030358979909402780800718157159386076813972158567259200215660948447373040") + BigInt(1),
      preimage: command.asCircuitInputs(),
    });

    expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).to.eq(true);

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "valid");
    expect(isValid.toString()).to.be.eq("0");
    expect((await getSignal(circuit, witness, "verifier.isCcZero.out")).toString()).to.be.eq("0");
  });
});
