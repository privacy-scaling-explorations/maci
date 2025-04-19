import { verifySignature, hash4 } from "@maci-protocol/crypto";
import { Keypair, PCommand } from "@maci-protocol/domainobjs";
import { expect } from "chai";
import { type WitnessTester } from "circomkit";

import { getSignal, circomkitInstance } from "./utils/utils";

describe("Signature verification circuit", function test() {
  this.timeout(90000);

  let circuit: WitnessTester<["publicKey", "signaturePoint", "signatureScalar", "preimage"], ["isValid"]>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("verifySignature", {
      file: "./utils/VerifySignature",
      template: "VerifySignature",
    });
  });

  it("should verify a valid signature", async () => {
    const keypair = new Keypair();
    const command = new PCommand(
      BigInt(0),
      keypair.publicKey,
      BigInt(123),
      BigInt(123),
      BigInt(1),
      BigInt(2),
      BigInt(3),
    );

    const signer = new Keypair();
    const sig = command.sign(signer.privateKey);
    const plaintext = hash4(command.asArray());

    expect(verifySignature(plaintext, sig, signer.publicKey.rawPubKey)).to.eq(true);

    const circuitInputs = {
      publicKey: signer.publicKey.asCircuitInputs() as unknown as [bigint, bigint],
      signaturePoint: sig.R8 as [bigint, bigint],
      signatureScalar: sig.S as bigint,
      preimage: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("1");
  });

  it("should reject an invalid signature (wrong signer)", async () => {
    const keypair = new Keypair();
    const command = new PCommand(
      BigInt(0),
      keypair.publicKey,
      BigInt(123),
      BigInt(123),
      BigInt(1),
      BigInt(2),
      BigInt(3),
    );

    const signer = new Keypair();
    const wrongSigner = new Keypair();

    expect(signer.privateKey.rawPrivKey).not.to.be.eq(wrongSigner.privateKey.rawPrivKey);

    const sig = command.sign(signer.privateKey);

    const plaintext = hash4(command.asArray());

    // The signature is signed by `signer`
    expect(verifySignature(plaintext, sig, signer.publicKey.rawPubKey)).to.eq(true);

    // The signature is not signed by `wrongSigner`
    expect(verifySignature(plaintext, sig, wrongSigner.publicKey.rawPubKey)).to.eq(false);

    const circuitInputs = {
      publicKey: wrongSigner.publicKey.asCircuitInputs() as unknown as [bigint, bigint],
      signaturePoint: sig.R8 as [bigint, bigint],
      signatureScalar: sig.S as bigint,
      preimage: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should reject an invalid signature (wrong S)", async () => {
    const keypair = new Keypair();
    const command = new PCommand(
      BigInt(0),
      keypair.publicKey,
      BigInt(123),
      BigInt(123),
      BigInt(1),
      BigInt(2),
      BigInt(3),
    );

    const signer = new Keypair();
    const sig = command.sign(signer.privateKey);
    const plaintext = hash4(command.asArray());

    expect(verifySignature(plaintext, sig, signer.publicKey.rawPubKey)).to.eq(true);

    const circuitInputs = {
      publicKey: signer.publicKey.asCircuitInputs() as unknown as [bigint, bigint],
      signaturePoint: sig.R8 as [bigint, bigint],
      signatureScalar:
        BigInt("2736030358979909402780800718157159386076813972158567259200215660948447373040") + BigInt(1),
      preimage: command.asCircuitInputs(),
    };

    expect(verifySignature(plaintext, sig, signer.publicKey.rawPubKey)).to.eq(true);

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });
});
