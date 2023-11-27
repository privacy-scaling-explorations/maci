import { stringifyBigInts, genRandomSalt } from "maci-crypto";
import { PCommand, Keypair } from "maci-domainobjs";
import { join } from "path";
import { expect } from "chai";
const tester = require("circom_tester").wasm;
import { getSignal } from "./utils/utils";

describe("StateLeafAndBallotTransformer circuit", function () {
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
  const numSignUps = 25;
  const maxVoteOptions = 25;

  const slKeypair = new Keypair();
  const slPubKey = slKeypair.pubKey;

  const slVoiceCreditBalance = BigInt(100);
  const ballotNonce = BigInt(0);
  const ballotCurrentVotesForOption = BigInt(0);
  const slTimestamp = 1;
  const pollEndTimestamp = 2;

  const command: PCommand = new PCommand(stateIndex, newPubKey, voteOptionIndex, newVoteWeight, nonce, pollId, salt);

  const signature = command.sign(slKeypair.privKey);

  let circuit: any;
  before(async () => {
    const circuitPath = join(__dirname, "../../circom/test", `stateLeafAndBallotTransformer_test.circom`);
    circuit = await tester(circuitPath);
  });
  it("Should output new state leaf and ballot values if the command is valid", async () => {
    const circuitInputs = stringifyBigInts({
      numSignUps,
      maxVoteOptions,
      slPubKey: slPubKey.asCircuitInputs(),
      slVoiceCreditBalance,
      slTimestamp,
      pollEndTimestamp,
      ballotNonce,
      ballotCurrentVotesForOption,
      cmdStateIndex: command.stateIndex,
      cmdNewPubKey: command.newPubKey.asCircuitInputs(),
      cmdVoteOptionIndex: command.voteOptionIndex,
      cmdNewVoteWeight: command.newVoteWeight,
      cmdNonce: command.nonce,
      cmdPollId: command.pollId,
      cmdSalt: command.salt,
      cmdSigR8: signature.R8,
      cmdSigS: signature.S,
      packedCommand: command.asCircuitInputs(),
    });

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.checkConstraints(witness);

    const newSlPubKey0 = await getSignal(circuit, witness, "newSlPubKey[0]");
    const newSlPubKey1 = await getSignal(circuit, witness, "newSlPubKey[1]");
    const newBallotNonce = await getSignal(circuit, witness, "newBallotNonce");

    expect(newSlPubKey0.toString()).to.be.eq(command.newPubKey.rawPubKey[0].toString());
    expect(newSlPubKey1.toString()).to.be.eq(command.newPubKey.rawPubKey[1].toString());
    expect(newBallotNonce.toString()).to.be.eq(command.nonce.toString());

    const isValid = await getSignal(circuit, witness, "isValid");
    expect(isValid.toString()).to.be.eq("1");
  });

  it("Should output existing state leaf and ballot values if the command is invalid", async () => {
    const circuitInputs = stringifyBigInts({
      numSignUps,
      maxVoteOptions,
      slPubKey: slPubKey.asCircuitInputs(),
      slVoiceCreditBalance,
      slTimestamp,
      pollEndTimestamp,
      ballotNonce,
      ballotCurrentVotesForOption,
      cmdStateIndex: command.stateIndex,
      cmdNewPubKey: command.newPubKey.asCircuitInputs(),
      cmdVoteOptionIndex: command.voteOptionIndex,
      cmdNewVoteWeight: command.newVoteWeight,
      cmdNonce: 2, // invalid
      cmdPollId: command.pollId,
      cmdSalt: command.salt,
      cmdSigR8: signature.R8,
      cmdSigS: signature.S,
      packedCommand: command.asCircuitInputs(),
    });

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.checkConstraints(witness);

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
