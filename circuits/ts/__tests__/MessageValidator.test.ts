import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { SignalValueType } from "circomkit/dist/types/circuit";
import { genRandomSalt } from "maci-crypto";
import { PCommand, Keypair } from "maci-domainobjs";

import { type IMessageValidatorCircuitInputs } from "./utils/types";
import { getSignal, circomkitInstance } from "./utils/utils";

describe("MessageValidator circuit", function test() {
  this.timeout(90000);

  let circuitInputs: IMessageValidatorCircuitInputs;

  let circuit: WitnessTester<
    [
      "stateTreeIndex",
      "numSignUps",
      "voteOptionIndex",
      "maxVoteOptions",
      "originalNonce",
      "nonce",
      "cmd",
      "pubKey",
      "sigR8",
      "sigS",
      "currentVoiceCreditBalance",
      "currentVotesForOption",
      "voteWeight",
      "slTimestamp",
      "pollEndTimestamp",
    ],
    ["isValid"]
  >;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("messageValidator", {
      file: "messageValidator",
      template: "MessageValidator",
    });
  });

  before(() => {
    const { privKey, pubKey } = new Keypair();

    // Note that the command fields don't matter in this test
    const command: PCommand = new PCommand(
      BigInt(1),
      pubKey,
      BigInt(2),
      BigInt(3),
      BigInt(4),
      BigInt(5),
      genRandomSalt(),
    );

    const signature = command.sign(privKey);

    circuitInputs = {
      stateTreeIndex: 0n as SignalValueType,
      numSignUps: 1n,
      voteOptionIndex: 0n,
      maxVoteOptions: 1n,
      originalNonce: 1n,
      nonce: 2n,
      cmd: command.asCircuitInputs(),
      pubKey: pubKey.asCircuitInputs() as unknown as [bigint, bigint],
      sigR8: signature.R8 as unknown as bigint,
      sigS: signature.S as bigint,
      currentVoiceCreditBalance: 100n,
      currentVotesForOption: 0n,
      voteWeight: 9n,
      slTimestamp: 1n,
      pollEndTimestamp: 2n,
    };
  });

  it("should pass if all inputs are valid", async () => {
    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("1");
  });

  it("should be invalid if the signature is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.sigS = 0n;
    const witness = await circuit.calculateWitness(circuitInputs2);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should be invalid if the pubkey is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.pubKey = [0n, 1n];
    const witness = await circuit.calculateWitness(circuitInputs2);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should be invalid if there are insufficient voice credits", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.voteWeight = 11n;
    const witness = await circuit.calculateWitness(circuitInputs2);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should be invalid if the nonce is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.nonce = 3n;
    const witness = await circuit.calculateWitness(circuitInputs2);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should be invalid if the state leaf index is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.stateTreeIndex = 2n;
    const witness = await circuit.calculateWitness(circuitInputs2);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should be invalid if the vote option index is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.voteOptionIndex = 1n;
    const witness = await circuit.calculateWitness(circuitInputs2);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should be invalid if the vote option index is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.voteOptionIndex = 6049261729n;
    const witness = await circuit.calculateWitness(circuitInputs2);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should be invalid if the state leaf timestamp is too high", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.slTimestamp = 3n;
    const witness = await circuit.calculateWitness(circuitInputs2);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });
});
