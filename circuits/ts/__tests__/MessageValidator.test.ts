import { expect } from "chai";
import tester from "circom_tester";
import { stringifyBigInts, genRandomSalt } from "maci-crypto";
import { PCommand, Keypair } from "maci-domainobjs";

import path from "path";

import type { CircuitInputs } from "maci-core";

import { getSignal } from "./utils/utils";

describe("MessageValidator circuit", function test() {
  this.timeout(90000);
  let circuitInputs: CircuitInputs;
  let circuit: tester.WasmTester;

  before(async () => {
    const circuitPath = path.resolve(__dirname, "../../circom/test", `messageValidator_test.circom`);
    circuit = await tester.wasm(circuitPath);
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

    circuitInputs = stringifyBigInts({
      stateTreeIndex: 0n,
      numSignUps: 1n,
      voteOptionIndex: 0n,
      maxVoteOptions: 1n,
      originalNonce: 1n,
      nonce: 2n,
      cmd: command.asCircuitInputs(),
      pubKey: pubKey.asCircuitInputs(),
      sigR8: signature.R8,
      sigS: signature.S,
      currentVoiceCreditBalance: 100n,
      currentVotesForOption: 0n,
      voteWeight: 9n,
      slTimestamp: 1n,
      pollEndTimestamp: 2n,
    }) as CircuitInputs;
  });

  it("Should pass if all inputs are valid", async () => {
    const witness = await circuit.calculateWitness(circuitInputs, true);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("1");
  });

  it("Should be invalid if the signature is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.sigS = "0";
    const witness = await circuit.calculateWitness(circuitInputs2, true);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("Should be invalid if the pubkey is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.pubKey = [0n, 1n];
    const witness = await circuit.calculateWitness(circuitInputs2, true);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("Should be invalid if there are insufficient voice credits", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.voteWeight = 11n;
    const witness = await circuit.calculateWitness(circuitInputs2, true);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("Should be invalid if the nonce is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.nonce = 3n;
    const witness = await circuit.calculateWitness(circuitInputs2, true);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("Should be invalid if the state leaf index is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.stateTreeIndex = 2n;
    const witness = await circuit.calculateWitness(circuitInputs2, true);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("Should be invalid if the vote option index is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.voteOptionIndex = 1n;
    const witness = await circuit.calculateWitness(circuitInputs2, true);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("Should be invalid if the vote option index is invalid", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.voteOptionIndex = "6049261729";
    const witness = await circuit.calculateWitness(circuitInputs2, true);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("Should be invalid if the state leaf timestamp is too high", async () => {
    const circuitInputs2 = circuitInputs;
    circuitInputs2.slTimestamp = "3";
    const witness = await circuit.calculateWitness(circuitInputs2, true);
    await circuit.checkConstraints(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });
});
