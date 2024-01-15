import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { genRandomSalt } from "maci-crypto";
import { PCommand, Keypair } from "maci-domainobjs";

import { getSignal, circomkitInstance } from "./utils/utils";

describe("StateLeafAndBallotTransformer circuit", function test() {
  this.timeout(90000);

  // variables needed for testing
  const keypair = new Keypair();
  const stateIndex = BigInt(1);
  const newPubKey = keypair.pubKey;
  const voteOptionIndex = BigInt(0);
  const newVoteWeight = BigInt(9);
  const nonce = BigInt(1);
  const pollId = BigInt(0);
  const salt = genRandomSalt();
  const numSignUps = 25n;
  const maxVoteOptions = 25n;

  const slKeypair = new Keypair();
  const slPubKey = slKeypair.pubKey;

  const slVoiceCreditBalance = BigInt(100);
  const ballotNonce = BigInt(0);
  const ballotCurrentVotesForOption = BigInt(0);
  const slTimestamp = 1n;
  const pollEndTimestamp = 2n;

  const command: PCommand = new PCommand(stateIndex, newPubKey, voteOptionIndex, newVoteWeight, nonce, pollId, salt);

  const signature = command.sign(slKeypair.privKey);

  let circuit: WitnessTester<
    [
      "numSignUps",
      "maxVoteOptions",
      "slPubKey",
      "slVoiceCreditBalance",
      "slTimestamp",
      "pollEndTimestamp",
      "ballotNonce",
      "ballotCurrentVotesForOption",
      "cmdStateIndex",
      "cmdNewPubKey",
      "cmdVoteOptionIndex",
      "cmdNewVoteWeight",
      "cmdNonce",
      "cmdPollId",
      "cmdSalt",
      "cmdSigR8",
      "cmdSigS",
      "packedCommand",
    ],
    ["newSlPubKey", "newBallotNonce", "isValid"]
  >;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("stateLeafAndBallotTransformer", {
      file: "stateLeafAndBallotTransformer",
      template: "StateLeafAndBallotTransformer",
    });
  });

  it("should output new state leaf and ballot values if the command is valid", async () => {
    const circuitInputs = {
      numSignUps,
      maxVoteOptions,
      slPubKey: slPubKey.asCircuitInputs() as unknown as [bigint, bigint],
      slVoiceCreditBalance,
      slTimestamp,
      pollEndTimestamp,
      ballotNonce,
      ballotCurrentVotesForOption,
      cmdStateIndex: command.stateIndex,
      cmdNewPubKey: command.newPubKey.asCircuitInputs() as unknown as [bigint, bigint],
      cmdVoteOptionIndex: command.voteOptionIndex,
      cmdNewVoteWeight: command.newVoteWeight,
      cmdNonce: command.nonce,
      cmdPollId: command.pollId,
      cmdSalt: command.salt,
      cmdSigR8: signature.R8 as [bigint, bigint],
      cmdSigS: signature.S as bigint,
      packedCommand: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const newSlPubKey0 = await getSignal(circuit, witness, "newSlPubKey[0]");
    const newSlPubKey1 = await getSignal(circuit, witness, "newSlPubKey[1]");
    const newBallotNonce = await getSignal(circuit, witness, "newBallotNonce");

    expect(newSlPubKey0.toString()).to.be.eq(command.newPubKey.rawPubKey[0].toString());
    expect(newSlPubKey1.toString()).to.be.eq(command.newPubKey.rawPubKey[1].toString());
    expect(newBallotNonce.toString()).to.be.eq(command.nonce.toString());

    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("1");
  });

  it("should output existing state leaf and ballot values if the command is invalid", async () => {
    const circuitInputs = {
      numSignUps,
      maxVoteOptions,
      slPubKey: slPubKey.asCircuitInputs() as unknown as [bigint, bigint],
      slVoiceCreditBalance,
      slTimestamp,
      pollEndTimestamp,
      ballotNonce,
      ballotCurrentVotesForOption,
      cmdStateIndex: command.stateIndex,
      cmdNewPubKey: command.newPubKey.asCircuitInputs() as unknown as [bigint, bigint],
      cmdVoteOptionIndex: command.voteOptionIndex,
      cmdNewVoteWeight: command.newVoteWeight,
      cmdNonce: 2n, // invalid
      cmdPollId: command.pollId,
      cmdSalt: command.salt,
      cmdSigR8: signature.R8 as [bigint, bigint],
      cmdSigS: signature.S as bigint,
      packedCommand: command.asCircuitInputs(),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const newSlPubKey0 = await getSignal(circuit, witness, "newSlPubKey[0]");
    const newSlPubKey1 = await getSignal(circuit, witness, "newSlPubKey[1]");
    const newBallotNonce = await getSignal(circuit, witness, "newBallotNonce");

    expect(newSlPubKey0.toString()).to.be.eq(slPubKey.rawPubKey[0].toString());
    expect(newSlPubKey1.toString()).to.be.eq(slPubKey.rawPubKey[1].toString());
    expect(newBallotNonce.toString()).to.be.eq("0");

    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("0");
  });
});
