import { generateRandomSalt } from "@maci-protocol/crypto";
import { VoteCommand, Keypair } from "@maci-protocol/domainobjs";
import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import fc from "fast-check";

import { maxSignups, maxVoteOptions } from "./utils/constants";
import { getSignal, circomkitInstance } from "./utils/utils";

describe("StateLeafAndBallotTransformerFull circuit", function test() {
  this.timeout(90000);

  // variables needed for testing
  const keypair = new Keypair();
  const newPublicKey = keypair.publicKey;
  const newVoteWeight = 9n;
  const pollId = 0n;
  const salt = generateRandomSalt();

  const stateLeafKeypair = new Keypair();
  const stateLeafPublicKey = stateLeafKeypair.publicKey;

  const stateLeafVoiceCreditBalance = 9n;
  const ballotNonce = 0n;
  const ballotCurrentVotesForOption = 0n;

  const command = new VoteCommand(1n, newPublicKey, 0n, newVoteWeight, 1n, pollId, salt);

  const signature = command.sign(stateLeafKeypair.privateKey);

  let circuit: WitnessTester<
    [
      "totalSignups",
      "voteOptions",
      "stateLeafPublicKey",
      "stateLeafVoiceCreditBalance",
      "ballotNonce",
      "ballotCurrentVotesForOption",
      "commandStateIndex",
      "commandPublicKey",
      "commandVoteOptionIndex",
      "commandNewVoteWeight",
      "commandNonce",
      "commandPollId",
      "commandSalt",
      "commandSignaturePoint",
      "commandSignatureScalar",
      "packedCommand",
    ],
    ["newStateLeafPublicKey", "newBallotNonce", "isValid", "isStateLeafIndexValid", "isVoteOptionIndexValid"]
  >;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("StateLeafAndBallotTransformerFull", {
      file: "./utils/full/StateLeafAndBallotTransformer",
      template: "StateLeafAndBallotTransformerFull",
    });
  });

  it("should output new state leaf and ballot values if the command is valid (full credits voting)", async () => {
    const circuitInputs = {
      totalSignups: maxSignups,
      voteOptions: maxVoteOptions,
      stateLeafPublicKey: stateLeafPublicKey.asCircuitInputs() as unknown as [bigint, bigint],
      stateLeafVoiceCreditBalance,
      ballotNonce,
      ballotCurrentVotesForOption,
      commandStateIndex: command.stateIndex,
      commandPublicKey: command.newPublicKey.asCircuitInputs() as unknown as [bigint, bigint],
      commandVoteOptionIndex: command.voteOptionIndex,
      commandNewVoteWeight: command.newVoteWeight,
      commandNonce: command.nonce,
      commandPollId: command.pollId,
      commandSalt: command.salt,
      commandSignaturePoint: signature.R8 as [bigint, bigint],
      commandSignatureScalar: signature.S as bigint,
      packedCommand: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const newStateLeafPublicKey0 = await getSignal(circuit, witness, "newStateLeafPublicKey[0]");
    const newStateLeafPublicKey1 = await getSignal(circuit, witness, "newStateLeafPublicKey[1]");
    const newBallotNonce = await getSignal(circuit, witness, "newBallotNonce");

    expect(newStateLeafPublicKey0.toString()).to.be.eq(command.newPublicKey.raw[0].toString());
    expect(newStateLeafPublicKey1.toString()).to.be.eq(command.newPublicKey.raw[1].toString());
    expect(newBallotNonce.toString()).to.be.eq(command.nonce.toString());

    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("1");
  });

  it("should output existing state leaf and ballot values if the command is invalid (full credits voting)", async () => {
    const circuitInputs = {
      totalSignups: maxSignups,
      voteOptions: maxVoteOptions,
      stateLeafPublicKey: stateLeafPublicKey.asCircuitInputs() as unknown as [bigint, bigint],
      stateLeafVoiceCreditBalance,
      ballotNonce,
      ballotCurrentVotesForOption,
      commandStateIndex: command.stateIndex,
      commandPublicKey: command.newPublicKey.asCircuitInputs() as unknown as [bigint, bigint],
      commandVoteOptionIndex: command.voteOptionIndex,
      commandNewVoteWeight: command.newVoteWeight,
      commandNonce: 2n, // invalid
      commandPollId: command.pollId,
      commandSalt: command.salt,
      commandSignaturePoint: signature.R8 as [bigint, bigint],
      commandSignatureScalar: signature.S as bigint,
      packedCommand: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const newStateLeafPublicKey0 = await getSignal(circuit, witness, "newStateLeafPublicKey[0]");
    const newStateLeafPublicKey1 = await getSignal(circuit, witness, "newStateLeafPublicKey[1]");
    const newBallotNonce = await getSignal(circuit, witness, "newBallotNonce");

    expect(newStateLeafPublicKey0.toString()).to.be.eq(stateLeafPublicKey.raw[0].toString());
    expect(newStateLeafPublicKey1.toString()).to.be.eq(stateLeafPublicKey.raw[1].toString());
    expect(newBallotNonce.toString()).to.be.eq("0");

    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should output existing state leaf and ballot values if voice credits are not fully spent", async () => {
    const circuitInputs = {
      totalSignups: maxSignups,
      voteOptions: maxVoteOptions,
      stateLeafPublicKey: stateLeafPublicKey.asCircuitInputs() as unknown as [bigint, bigint],
      stateLeafVoiceCreditBalance: stateLeafVoiceCreditBalance + 1n,
      ballotNonce,
      ballotCurrentVotesForOption,
      commandStateIndex: command.stateIndex,
      commandPublicKey: command.newPublicKey.asCircuitInputs() as unknown as [bigint, bigint],
      commandVoteOptionIndex: command.voteOptionIndex,
      commandNewVoteWeight: command.newVoteWeight,
      commandNonce: command.nonce, // invalid
      commandPollId: command.pollId,
      commandSalt: command.salt,
      commandSignaturePoint: signature.R8 as [bigint, bigint],
      commandSignatureScalar: signature.S as bigint,
      packedCommand: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const newStateLeafPublicKey0 = await getSignal(circuit, witness, "newStateLeafPublicKey[0]");
    const newStateLeafPublicKey1 = await getSignal(circuit, witness, "newStateLeafPublicKey[1]");
    const newBallotNonce = await getSignal(circuit, witness, "newBallotNonce");

    expect(newStateLeafPublicKey0.toString()).to.be.eq(stateLeafPublicKey.raw[0].toString());
    expect(newStateLeafPublicKey1.toString()).to.be.eq(stateLeafPublicKey.raw[1].toString());
    expect(newBallotNonce.toString()).to.be.eq("0");

    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should output existing state leaf and ballot values if voice credits are not match with vote weight", async () => {
    const circuitInputs = {
      totalSignups: maxSignups,
      voteOptions: maxVoteOptions,
      stateLeafPublicKey: stateLeafPublicKey.asCircuitInputs() as unknown as [bigint, bigint],
      stateLeafVoiceCreditBalance,
      ballotNonce,
      ballotCurrentVotesForOption: ballotCurrentVotesForOption - 1n,
      commandStateIndex: command.stateIndex,
      commandPublicKey: command.newPublicKey.asCircuitInputs() as unknown as [bigint, bigint],
      commandVoteOptionIndex: command.voteOptionIndex,
      commandNewVoteWeight: command.newVoteWeight,
      commandNonce: command.nonce, // invalid
      commandPollId: command.pollId,
      commandSalt: command.salt,
      commandSignaturePoint: signature.R8 as [bigint, bigint],
      commandSignatureScalar: signature.S as bigint,
      packedCommand: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const newStateLeafPublicKey0 = await getSignal(circuit, witness, "newStateLeafPublicKey[0]");
    const newStateLeafPublicKey1 = await getSignal(circuit, witness, "newStateLeafPublicKey[1]");
    const newBallotNonce = await getSignal(circuit, witness, "newBallotNonce");

    expect(newStateLeafPublicKey0.toString()).to.be.eq(stateLeafPublicKey.raw[0].toString());
    expect(newStateLeafPublicKey1.toString()).to.be.eq(stateLeafPublicKey.raw[1].toString());
    expect(newBallotNonce.toString()).to.be.eq("0");

    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });

  it("should check state leaf and ballot transformers (full credits voting)", async () => {
    const max = BigInt(2 ** 50);

    await fc.assert(
      fc.asyncProperty(
        fc.bigInt({ min: 1n, max }),
        fc.bigInt({ min: 1n, max }),
        fc.bigInt({ min: 1n, max }),
        fc.bigInt({ min: 1n, max }),
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
      const userCommand = new VoteCommand(stateTreeIndex, publicKey, voteOptionIndex, votes, nonce, 0n);
      const commandSignature = userCommand.sign(privateKey);

      const circuitInputs = {
        totalSignups: stateTreeIndex + maxSignupsDifference,
        voteOptions: voteOptionIndex + maxVoteOptionsDifference,
        stateLeafPublicKey: publicKey.asCircuitInputs() as unknown as [bigint, bigint],
        stateLeafVoiceCreditBalance: votes,
        ballotNonce: nonce - 1n,
        ballotCurrentVotesForOption: 0n,
        commandStateIndex: userCommand.stateIndex,
        commandPublicKey: userCommand.newPublicKey.asCircuitInputs() as unknown as [bigint, bigint],
        commandVoteOptionIndex: userCommand.voteOptionIndex,
        commandNewVoteWeight: userCommand.newVoteWeight,
        commandNonce: userCommand.nonce,
        commandPollId: userCommand.pollId,
        commandSalt: userCommand.salt,
        commandSignaturePoint: commandSignature.R8 as [bigint, bigint],
        commandSignatureScalar: commandSignature.S as bigint,
        packedCommand: userCommand.asCircuitInputs(),
      };

      const witness = await circuit.calculateWitness(circuitInputs);
      await circuit.expectConstraintPass(witness);

      const newStateLeafPublicKey0 = await getSignal(circuit, witness, "newStateLeafPublicKey[0]");
      const newStateLeafPublicKey1 = await getSignal(circuit, witness, "newStateLeafPublicKey[1]");
      const newBallotNonce = await getSignal(circuit, witness, "newBallotNonce");
      const isValid = await getSignal(circuit, witness, "isValid");
      const isStateLeafIndexValid = await getSignal(circuit, witness, "isStateLeafIndexValid");
      const isVoteOptionIndexValid = await getSignal(circuit, witness, "isVoteOptionIndexValid");

      return (
        isValid.toString() === "1" &&
        isStateLeafIndexValid.toString() === "1" &&
        isVoteOptionIndexValid.toString() === "1" &&
        newBallotNonce.toString() === userCommand.nonce.toString() &&
        newStateLeafPublicKey0.toString() === userCommand.newPublicKey.raw[0].toString() &&
        newStateLeafPublicKey1.toString() === userCommand.newPublicKey.raw[1].toString()
      );
    }
  });
});
