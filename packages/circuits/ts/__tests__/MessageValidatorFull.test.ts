import { generateRandomSalt } from "@maci-protocol/crypto";
import { VoteCommand, Keypair } from "@maci-protocol/domainobjs";
import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import fc from "fast-check";

import { maxVoteOptions, maxSignups } from "./utils/constants";
import { type IMessageValidatorCircuitInputs } from "./utils/types";
import { getSignal, circomkitInstance } from "./utils/utils";

describe("MessageValidatorFull circuit", function test() {
  this.timeout(90000);

  let circuitInputs: Omit<IMessageValidatorCircuitInputs, "currentVoiceCreditBalance"> & {
    currentVoiceCreditBalance: bigint;
  };

  let circuit: WitnessTester<
    [
      "stateTreeIndex",
      "totalSignups",
      "voteOptionIndex",
      "voteOptions",
      "originalNonce",
      "commandNonce",
      "command",
      "publicKey",
      "signaturePoint",
      "signatureScalar",
      "currentVoiceCreditBalance",
      "currentVotesForOption",
      "voteWeight",
    ],
    ["isValid", "isStateLeafIndexValid", "isVoteOptionIndexValid"]
  >;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("MessageValidatorFull", {
      file: "./utils/full/MessageValidator",
      template: "MessageValidatorFull",
    });
  });

  before(() => {
    const { privateKey, publicKey } = new Keypair();

    // Note that the command fields don't matter in this test
    const command: VoteCommand = new VoteCommand(
      BigInt(1),
      publicKey,
      BigInt(2),
      BigInt(3),
      BigInt(4),
      BigInt(5),
      generateRandomSalt(),
    );

    const signature = command.sign(privateKey);

    circuitInputs = {
      stateTreeIndex: 0n,
      totalSignups: 1n,
      voteOptionIndex: 0n,
      voteOptions: 1n,
      originalNonce: 1n,
      commandNonce: 2n,
      command: command.asCircuitInputs(),
      publicKey: publicKey.asCircuitInputs() as unknown as [bigint, bigint],
      signaturePoint: signature.R8 as unknown as bigint,
      signatureScalar: signature.S as bigint,
      currentVoiceCreditBalance: 1n,
      currentVotesForOption: 0n,
      voteWeight: 1n,
    };
  });

  it("should pass if all inputs are valid", async () => {
    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
    const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

    expect(isValid.toString()).to.be.eq("1");
    expect(isStateLeafIndexValid.toString()).to.be.eq("1");
    expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
  });

  it("should be invalid if the signature is invalid", async () => {
    const circuitInputsCopy = { ...circuitInputs };
    circuitInputsCopy.signatureScalar = 0n;

    const witness = await circuit.calculateWitness(circuitInputsCopy);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
    const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

    expect(isValid.toString()).to.be.eq("0");
    expect(isStateLeafIndexValid.toString()).to.be.eq("1");
    expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
  });

  it("should be invalid if the publicKey is invalid", async () => {
    const circuitInputsCopy = { ...circuitInputs };
    circuitInputsCopy.publicKey = [0n, 1n];

    const witness = await circuit.calculateWitness(circuitInputsCopy);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
    const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

    expect(isValid.toString()).to.be.eq("0");
    expect(isStateLeafIndexValid.toString()).to.be.eq("1");
    expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
  });

  it("should be invalid if there are insufficient voice credits", async () => {
    const circuitInputsCopy = { ...circuitInputs };
    circuitInputsCopy.currentVotesForOption = 0n;
    circuitInputsCopy.currentVoiceCreditBalance = 100n;
    circuitInputsCopy.voteWeight = 101n;

    const witness = await circuit.calculateWitness(circuitInputsCopy);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
    const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

    expect(isValid.toString()).to.be.eq("0");
    expect(isStateLeafIndexValid.toString()).to.be.eq("1");
    expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
  });

  it("should be invalid if there are not fully spent voice credits", async () => {
    const circuitInputsCopy = { ...circuitInputs };
    circuitInputsCopy.currentVotesForOption = 1n;
    circuitInputsCopy.currentVoiceCreditBalance = 2n;
    circuitInputsCopy.voteWeight = 1n;

    const witness = await circuit.calculateWitness(circuitInputsCopy);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
    const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

    expect(isValid.toString()).to.be.eq("0");
    expect(isStateLeafIndexValid.toString()).to.be.eq("1");
    expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
  });

  it("should be invalid if there are some voice credits left", async () => {
    const circuitInputsCopy = { ...circuitInputs };
    circuitInputsCopy.currentVoiceCreditBalance = 1n;
    circuitInputsCopy.currentVotesForOption = 100n;
    circuitInputsCopy.voteWeight = 100n;

    const witness = await circuit.calculateWitness(circuitInputsCopy);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
    const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

    expect(isValid.toString()).to.be.eq("0");
    expect(isStateLeafIndexValid.toString()).to.be.eq("1");
    expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
  });

  it("should be invalid if the nonce is invalid", async () => {
    const circuitInputsCopy = { ...circuitInputs };
    circuitInputsCopy.commandNonce = 3n;

    const witness = await circuit.calculateWitness(circuitInputsCopy);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
    const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

    expect(isValid.toString()).to.be.eq("0");
    expect(isStateLeafIndexValid.toString()).to.be.eq("1");
    expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
  });

  it("should be invalid if the state leaf index is invalid", async () => {
    const circuitInputsCopy = { ...circuitInputs };
    circuitInputsCopy.stateTreeIndex = 2n;

    const witness = await circuit.calculateWitness(circuitInputsCopy);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
    const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

    expect(isValid.toString()).to.be.eq("0");
    expect(isStateLeafIndexValid.toString()).to.be.eq("0");
    expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
  });

  it("should be invalid if the vote option index is invalid", async () => {
    const circuitInputsCopy = { ...circuitInputs };
    circuitInputsCopy.voteOptionIndex = 1n;
    circuitInputsCopy.stateTreeIndex = 2n;

    const witness = await circuit.calculateWitness(circuitInputsCopy);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
    const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

    expect(isValid.toString()).to.be.eq("0");
    expect(isStateLeafIndexValid.toString()).to.be.eq("0");
    expect(isVoteOptionIndexValid.toString()).to.be.eq("0");
  });

  it("should be invalid if the vote option index is invalid", async () => {
    const circuitInputsCopy = { ...circuitInputs };
    circuitInputsCopy.voteOptionIndex = 6049261729n;
    circuitInputsCopy.stateTreeIndex = 2n;

    const witness = await circuit.calculateWitness(circuitInputsCopy);
    await circuit.expectConstraintPass(witness);
    const isValid = await getSignal(circuit, witness, "isValid");
    const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
    const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

    expect(isValid.toString()).to.be.eq("0");
    expect(isStateLeafIndexValid.toString()).to.be.eq("0");
    expect(isVoteOptionIndexValid.toString()).to.be.eq("0");
  });

  it("should check message validator properly", async () => {
    const max = BigInt(2 ** 50);

    await fc.assert(
      fc.asyncProperty(
        fc.bigInt({ min: 1n, max }),
        fc.bigInt({ min: 1n, max }),
        fc.bigInt({ min: 0n, max }),
        fc.bigInt({ min: 0n, max }),
        fc.bigInt({ min: 1n, max: max - maxSignups }),
        fc.bigInt({ min: 1n, max: max - maxVoteOptions }),
        check,
      ),
    );

    async function check(
      votes: bigint,
      nonce: bigint,
      stateTreeIndex: bigint,
      voteOptionIndex: bigint,
      maxSignupsDifference: bigint,
      maxVoteOptionsDifference: bigint,
    ) {
      const { privateKey, publicKey } = new Keypair();
      const command = new VoteCommand(stateTreeIndex, publicKey, voteOptionIndex, votes, nonce, 0n);

      const signature = command.sign(privateKey);

      const inputs = {
        originalNonce: nonce - 1n,
        commandNonce: nonce,
        currentVotesForOption: 0n,
        voteWeight: votes,
        currentVoiceCreditBalance: votes,
        signaturePoint: signature.R8 as unknown as bigint,
        signatureScalar: signature.S as bigint,
        publicKey: publicKey.asCircuitInputs() as unknown as [bigint, bigint],
        command: command.asCircuitInputs(),
        stateTreeIndex,
        totalSignups: stateTreeIndex + maxSignupsDifference,
        voteOptionIndex,
        voteOptions: voteOptionIndex + maxVoteOptionsDifference,
      };

      const witness = await circuit.calculateWitness(inputs);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

      return (
        isValid.toString() === "1" &&
        isStateLeafIndexValid.toString() === "1" &&
        isVoteOptionIndexValid.toString() === "1"
      );
    }
  });
});
