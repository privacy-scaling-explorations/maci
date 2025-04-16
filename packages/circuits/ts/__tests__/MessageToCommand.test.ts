import { genRandomSalt, genPrivKey } from "@maci-protocol/crypto";
import { Keypair, PCommand, PrivateKey } from "@maci-protocol/domainobjs";
import { expect } from "chai";
import { type WitnessTester } from "circomkit";

import { circomkitInstance, getSignal } from "./utils/utils";

describe("MessageToCommand circuit", function test() {
  this.timeout(900000);

  let circuit: WitnessTester<
    ["message", "encryptionPublicKey", "encryptionPublicKey"],
    [
      "stateIndex",
      "newPublicKey",
      "voteOptionIndex",
      "newVoteWeight",
      "nonce",
      "pollId",
      "salt",
      "signaturePoint",
      "signatureScalar",
      "packedCommandOut",
    ]
  >;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("messageToCommand", {
      file: "./utils/MessageToCommand",
      template: "MessageToCommand",
    });
  });

  it("should decrypt a Message and output the fields of a Command", async () => {
    const { privateKey } = new Keypair();
    const keypair = new Keypair();

    const { publicKey } = keypair;
    const newPublicKey = keypair.publicKey;

    const ecdhSharedKey = Keypair.genEcdhSharedKey(privateKey, publicKey);
    const random50bitBigInt = (): bigint =>
      // eslint-disable-next-line no-bitwise
      ((BigInt(1) << BigInt(50)) - BigInt(1)) & BigInt(genRandomSalt().toString());

    const command: PCommand = new PCommand(
      random50bitBigInt(),
      newPublicKey,
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      // genRandomSalt(),
      BigInt(123),
    );
    const signature = command.sign(privateKey);
    const message = command.encrypt(signature, ecdhSharedKey);

    const circuitInputs = {
      message: message.asCircuitInputs(),
      encryptionPrivateKey: privateKey.asCircuitInputs() as unknown as bigint,
      encryptionPublicKey: publicKey.asCircuitInputs() as unknown as bigint[],
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const stateIndexOut = await getSignal(circuit, witness, "stateIndex");
    expect(command.stateIndex.toString()).to.be.eq(stateIndexOut.toString());

    const newPublicKeyX = await getSignal(circuit, witness, "newPublicKey[0]");
    expect(command.newPublicKey.rawPubKey[0].toString()).to.be.eq(newPublicKeyX.toString());

    const newPublicKeyY = await getSignal(circuit, witness, "newPublicKey[1]");
    expect(command.newPublicKey.rawPubKey[1].toString()).to.be.eq(newPublicKeyY.toString());

    const voteOptionIndex = await getSignal(circuit, witness, "voteOptionIndex");
    expect(command.voteOptionIndex.toString()).to.be.eq(voteOptionIndex.toString());

    const newVoteWeight = await getSignal(circuit, witness, "newVoteWeight");
    expect(command.newVoteWeight.toString()).to.be.eq(newVoteWeight.toString());

    const nonce = await getSignal(circuit, witness, "nonce");
    expect(command.nonce.toString()).to.be.eq(nonce.toString());

    const pollId = await getSignal(circuit, witness, "pollId");
    expect(command.pollId.toString()).to.be.eq(pollId.toString());

    const salt = await getSignal(circuit, witness, "salt");
    expect(command.salt.toString()).to.be.eq(salt.toString());

    const signaturePointX = await getSignal(circuit, witness, "signaturePoint[0]");
    expect(signature.R8[0].toString()).to.be.eq(signaturePointX.toString());

    const signaturePointY = await getSignal(circuit, witness, "signaturePoint[1]");
    expect(signature.R8[1].toString()).to.be.eq(signaturePointY.toString());

    const signatureScalar = await getSignal(circuit, witness, "signatureScalar");
    expect(signature.S.toString()).to.be.eq(signatureScalar.toString());
  });

  it("should not throw when given an invalid key which cannot decrypt a Message", async () => {
    const { privateKey } = new Keypair();
    const keypair = new Keypair();

    const { publicKey } = keypair;
    const newPublicKey = keypair.publicKey;

    const ecdhSharedKey = Keypair.genEcdhSharedKey(privateKey, publicKey);
    const random50bitBigInt = (): bigint =>
      // eslint-disable-next-line no-bitwise
      ((BigInt(1) << BigInt(50)) - BigInt(1)) & BigInt(genRandomSalt().toString());

    const command: PCommand = new PCommand(
      random50bitBigInt(),
      newPublicKey,
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      // genRandomSalt(),
      BigInt(123),
    );
    const signature = command.sign(privateKey);
    const message = command.encrypt(signature, ecdhSharedKey);

    const circuitInputs = {
      message: message.asCircuitInputs(),
      // invalid private key
      encryptionPrivateKey: new PrivateKey(genPrivKey()).asCircuitInputs() as unknown as bigint,
      encryptionPublicKey: publicKey.asCircuitInputs() as unknown as [bigint, bigint],
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
  });
});
