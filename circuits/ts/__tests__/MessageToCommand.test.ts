import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { genRandomSalt, genPrivKey } from "maci-crypto";
import { Keypair, PCommand, PrivKey } from "maci-domainobjs";

import { circomkitInstance, getSignal } from "./utils/utils";

describe("MessageToCommand circuit", () => {
  let circuit: WitnessTester<
    ["message", "encPubKey", "encPubKey"],
    [
      "stateIndex",
      "newPubKey",
      "voteOptionIndex",
      "newVoteWeight",
      "nonce",
      "pollId",
      "salt",
      "sigR8",
      "sigS",
      "packedCommandOut",
    ]
  >;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("messageToCommand", {
      file: "messageToCommand",
      template: "MessageToCommand",
    });
  });

  it("should decrypt a Message and output the fields of a Command", async () => {
    const { privKey } = new Keypair();
    const k = new Keypair();

    const pubKey1 = k.pubKey;

    const newPubKey = k.pubKey;

    const ecdhSharedKey = Keypair.genEcdhSharedKey(privKey, pubKey1);
    const random50bitBigInt = (): bigint =>
      // eslint-disable-next-line no-bitwise
      ((BigInt(1) << BigInt(50)) - BigInt(1)) & BigInt(genRandomSalt().toString());

    const command: PCommand = new PCommand(
      random50bitBigInt(),
      newPubKey,
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      // genRandomSalt(),
      BigInt(123),
    );
    const signature = command.sign(privKey);
    const message = command.encrypt(signature, ecdhSharedKey);

    const circuitInputs = {
      message: message.asCircuitInputs(),
      encPrivKey: privKey.asCircuitInputs() as unknown as bigint,
      encPubKey: pubKey1.asCircuitInputs() as unknown as bigint[],
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const stateIndexOut = await getSignal(circuit, witness, "stateIndex");
    expect(command.stateIndex.toString()).to.be.eq(stateIndexOut.toString());

    const newPubKey0 = await getSignal(circuit, witness, "newPubKey[0]");
    expect(command.newPubKey.rawPubKey[0].toString()).to.be.eq(newPubKey0.toString());

    const newPubKey1 = await getSignal(circuit, witness, "newPubKey[1]");
    expect(command.newPubKey.rawPubKey[1].toString()).to.be.eq(newPubKey1.toString());

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

    const sigR80 = await getSignal(circuit, witness, "sigR8[0]");
    expect(signature.R8[0].toString()).to.be.eq(sigR80.toString());

    const sigR81 = await getSignal(circuit, witness, "sigR8[1]");
    expect(signature.R8[1].toString()).to.be.eq(sigR81.toString());

    const sigS = await getSignal(circuit, witness, "sigS");
    expect(signature.S.toString()).to.be.eq(sigS.toString());
  });

  it("should not throw when given an invalid key which cannot decrypt a Message", async () => {
    const { privKey } = new Keypair();
    const k = new Keypair();

    const pubKey1 = k.pubKey;

    const newPubKey = k.pubKey;

    const ecdhSharedKey = Keypair.genEcdhSharedKey(privKey, pubKey1);
    const random50bitBigInt = (): bigint =>
      // eslint-disable-next-line no-bitwise
      ((BigInt(1) << BigInt(50)) - BigInt(1)) & BigInt(genRandomSalt().toString());

    const command: PCommand = new PCommand(
      random50bitBigInt(),
      newPubKey,
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      // genRandomSalt(),
      BigInt(123),
    );
    const signature = command.sign(privKey);
    const message = command.encrypt(signature, ecdhSharedKey);

    const circuitInputs = {
      message: message.asCircuitInputs(),
      // invalid private key
      encPrivKey: new PrivKey(genPrivKey()).asCircuitInputs() as unknown as bigint,
      encPubKey: pubKey1.asCircuitInputs() as unknown as [bigint, bigint],
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
  });
});
