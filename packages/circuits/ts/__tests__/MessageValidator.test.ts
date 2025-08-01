import { generateRandomSalt } from "@maci-protocol/crypto";
import { VoteCommand, Keypair } from "@maci-protocol/domainobjs";
import { expect } from "chai";
import { type WitnessTester } from "circomkit";

import { type IMessageValidatorCircuitInputs } from "./utils/types";
import { getSignal, circomkitInstance } from "./utils/utils";

describe("MessageValidator circuit", function test() {
  this.timeout(90000);

  describe("MessageValidatorQV", () => {
    let circuitInputs: IMessageValidatorCircuitInputs;

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
      circuit = await circomkitInstance.WitnessTester("MessageValidator", {
        file: "./utils/qv/MessageValidator",
        template: "MessageValidator",
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
        currentVoiceCreditBalance: 100n,
        currentVotesForOption: 0n,
        voteWeight: 9n,
      };
    });

    it("should pass if all inputs are valid", async () => {
      const witness = await circuit.calculateWitness(circuitInputs);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("1");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("1");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if the signature is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.signatureScalar = 0n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("1");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if the publicKey is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.publicKey = [0n, 1n];
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("1");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if there are insufficient voice credits", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.voteWeight = 11n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("1");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if the nonce is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.commandNonce = 3n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("1");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if the state leaf index is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.stateTreeIndex = 2n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("0");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if the vote option index is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.voteOptionIndex = 1n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("0");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("0");
    });

    it("should be invalid if the vote option index is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.voteOptionIndex = 6049261729n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("0");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("0");
    });
  });

  describe("MessageValidatorNonQV", () => {
    let circuitInputs: IMessageValidatorCircuitInputs;

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
      circuit = await circomkitInstance.WitnessTester("MessageValidatorNonQv", {
        file: "./utils/non-qv/MessageValidator",
        template: "MessageValidatorNonQv",
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
        currentVoiceCreditBalance: 100n,
        currentVotesForOption: 0n,
        voteWeight: 9n,
      };
    });

    it("should pass if all inputs are valid", async () => {
      const witness = await circuit.calculateWitness(circuitInputs);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("1");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("1");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if the signature is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.signatureScalar = 0n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("1");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if the publicKey is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.publicKey = [0n, 1n];
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("1");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if there are insufficient voice credits", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.voteWeight = 11n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("1");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if the nonce is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.commandNonce = 3n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("1");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if the state leaf index is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.stateTreeIndex = 2n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("0");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("1");
    });

    it("should be invalid if the vote option index is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.voteOptionIndex = 1n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("0");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("0");
    });

    it("should be invalid if the vote option index is invalid", async () => {
      const circuitInputsCopy = circuitInputs;
      circuitInputsCopy.voteOptionIndex = 6049261729n;
      const witness = await circuit.calculateWitness(circuitInputsCopy);
      await circuit.expectConstraintPass(witness);
      const isValid = await getSignal(circuit, witness, "isValid");
      expect(isValid.toString()).to.be.eq("0");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      expect(isStateLeafIndexValid.toString()).to.be.eq("0");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");
      expect(isVoteOptionIndexValid.toString()).to.be.eq("0");
    });
  });
});
