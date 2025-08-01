import { verifySignature, hash4 } from "@maci-protocol/crypto";
import { Keypair, VoteCommand } from "@maci-protocol/domainobjs";
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
    const command = new VoteCommand(
      BigInt(0),
      keypair.publicKey,
      BigInt(123),
      BigInt(123),
      BigInt(1),
      BigInt(2),
      BigInt(3),
    );

    const signer = new Keypair();
    const signature = command.sign(signer.privateKey);
    const plaintext = hash4(command.asArray());

    expect(verifySignature(plaintext, signature, signer.publicKey.raw)).to.eq(true);

    const circuitInputs = {
      publicKey: signer.publicKey.asCircuitInputs() as unknown as [bigint, bigint],
      signaturePoint: signature.R8 as [bigint, bigint],
      signatureScalar: signature.S as bigint,
      preimage: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("1");
  });

  it("should reject an invalid signature (wrong signer)", async () => {
    const keypair = new Keypair();
    const command = new VoteCommand(
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

    expect(signer.privateKey.raw).not.to.be.eq(wrongSigner.privateKey.raw);

    const signature = command.sign(signer.privateKey);

    const plaintext = hash4(command.asArray());

    // The signature is signed by `signer`
    expect(verifySignature(plaintext, signature, signer.publicKey.raw)).to.eq(true);

    // The signature is not signed by `wrongSigner`
    expect(verifySignature(plaintext, signature, wrongSigner.publicKey.raw)).to.eq(false);

    const circuitInputs = {
      publicKey: wrongSigner.publicKey.asCircuitInputs() as unknown as [bigint, bigint],
      signaturePoint: signature.R8 as [bigint, bigint],
      signatureScalar: signature.S as bigint,
      preimage: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should reject an invalid signature (wrong S)", async () => {
    const keypair = new Keypair();
    const command = new VoteCommand(
      BigInt(0),
      keypair.publicKey,
      BigInt(123),
      BigInt(123),
      BigInt(1),
      BigInt(2),
      BigInt(3),
    );

    const signer = new Keypair();
    const signature = command.sign(signer.privateKey);
    const plaintext = hash4(command.asArray());

    expect(verifySignature(plaintext, signature, signer.publicKey.raw)).to.eq(true);

    const circuitInputs = {
      publicKey: signer.publicKey.asCircuitInputs() as unknown as [bigint, bigint],
      signaturePoint: signature.R8 as [bigint, bigint],
      signatureScalar:
        BigInt("2736030358979909402780800718157159386076813972158567259200215660948447373040") + BigInt(1),
      preimage: command.asCircuitInputs(),
    };

    expect(verifySignature(plaintext, signature, signer.publicKey.raw)).to.eq(true);

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });
});
