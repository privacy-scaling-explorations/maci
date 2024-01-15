import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { verifySignature, hash4 } from "maci-crypto";
import { Keypair, PCommand } from "maci-domainobjs";

import { getSignal, circomkitInstance } from "./utils/utils";

describe("Signature verification circuit", function test() {
  this.timeout(90000);

  let circuit: WitnessTester<["pubKey", "R8", "S", "preimage"], ["valid"]>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("verifySignature", {
      file: "verifySignature",
      template: "VerifySignature",
    });
  });

  it("should verify a valid signature", async () => {
    const keypair = new Keypair();
    const command = new PCommand(BigInt(0), keypair.pubKey, BigInt(123), BigInt(123), BigInt(1), BigInt(2), BigInt(3));

    const signer = new Keypair();
    const sig = command.sign(signer.privKey);
    const plaintext = hash4(command.asArray());

    expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).to.eq(true);

    const circuitInputs = {
      pubKey: signer.pubKey.asCircuitInputs() as unknown as [bigint, bigint],
      R8: sig.R8 as [bigint, bigint],
      S: sig.S as bigint,
      preimage: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "valid");
    expect(isValid.toString()).to.be.eq("1");
  });

  it("should reject an invalid signature (wrong signer)", async () => {
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

    const circuitInputs = {
      pubKey: wrongSigner.pubKey.asCircuitInputs() as unknown as [bigint, bigint],
      R8: sig.R8 as [bigint, bigint],
      S: sig.S as bigint,
      preimage: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "valid");
    expect(isValid.toString()).to.be.eq("0");
    expect((await getSignal(circuit, witness, "verifier.isCcZero.out")).toString()).to.be.eq("1");
  });

  it("should reject an invalid signature (wrong S)", async () => {
    const keypair = new Keypair();
    const command = new PCommand(BigInt(0), keypair.pubKey, BigInt(123), BigInt(123), BigInt(1), BigInt(2), BigInt(3));

    const signer = new Keypair();
    const sig = command.sign(signer.privKey);
    const plaintext = hash4(command.asArray());

    expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).to.eq(true);

    const circuitInputs = {
      pubKey: signer.pubKey.asCircuitInputs() as unknown as [bigint, bigint],
      R8: sig.R8 as [bigint, bigint],
      S: BigInt("2736030358979909402780800718157159386076813972158567259200215660948447373040") + BigInt(1),
      preimage: command.asCircuitInputs(),
    };

    expect(verifySignature(plaintext, sig, signer.pubKey.rawPubKey)).to.eq(true);

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "valid");
    expect(isValid.toString()).to.be.eq("0");
    expect((await getSignal(circuit, witness, "verifier.isCcZero.out")).toString()).to.be.eq("0");
  });
});
