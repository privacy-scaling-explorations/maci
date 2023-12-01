import { STATE_TREE_DEPTH } from "./utils";

import { MaciState } from "maci-core";

import { Keypair, PCommand, Message } from "maci-domainobjs";

import path from "path";
import { expect } from "chai";
import { beforeEach } from "mocha";
const tester = require("circom_tester").wasm;

const voiceCreditBalance = BigInt(100);

const duration = 30;
const maxValues = {
  maxUsers: 25,
  maxMessages: 25,
  maxVoteOptions: 25,
};

const treeDepths = {
  intStateTreeDepth: 1,
  messageTreeDepth: 2,
  messageTreeSubDepth: 1,
  voteOptionTreeDepth: 2,
};

const messageBatchSize = 5;

const coordinatorKeypair = new Keypair();

describe("TallyVotes circuit", function () {
  this.timeout(900000);
  let circuit: any;

  before(async () => {
    const circuitPath = path.join(__dirname, "../../circom/test", `tallyVotes_test.circom`);
    circuit = await tester(circuitPath);
  });

  describe("1 user, 2 messages", () => {
    let stateIndex;
    let pollId;
    let poll;
    let maciState;
    const voteWeight = BigInt(9);
    const voteOptionIndex = BigInt(0);

    beforeEach(async () => {
      maciState = new MaciState(STATE_TREE_DEPTH);
      const messages: Message[] = [];
      const commands: PCommand[] = [];
      // Sign up and publish
      const userKeypair = new Keypair();
      stateIndex = maciState.signUp(userKeypair.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000)));

      maciState.stateAq.mergeSubRoots(0);
      maciState.stateAq.merge(STATE_TREE_DEPTH);

      pollId = maciState.deployPoll(
        duration,
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls[pollId];

      // First command (valid)
      const command = new PCommand(
        stateIndex,
        userKeypair.pubKey,
        voteOptionIndex, // voteOptionIndex,
        voteWeight, // vote weight
        BigInt(1), // nonce
        BigInt(pollId),
      );

      const signature = command.sign(userKeypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);
      messages.push(message);
      commands.push(command);

      poll.publishMessage(message, ecdhKeypair.pubKey);

      poll.messageAq.mergeSubRoots(0);
      poll.messageAq.merge(treeDepths.messageTreeDepth);

      expect(poll.messageTree.root.toString()).to.be.eq(poll.messageAq.getRoot(treeDepths.messageTreeDepth).toString());
      // Process messages
      poll.processMessages();
    });

    it("should produce the correct result commitments", async () => {
      const generatedInputs = poll.tallyVotes();
      const newResults = poll.results;

      expect(newResults[Number(voteOptionIndex)]).to.be.eq(voteWeight);

      const witness = await circuit.calculateWitness(generatedInputs);
      await circuit.checkConstraints(witness);

      // @todo seems like it's not possible to get certain signals due to
      // the large number of signals
    });

    it("should produce the correct result if the inital tally is not zero", async () => {
      const generatedInputs = poll.tallyVotes();
      //const newResults = poll.results

      // TODO: show that check constraint fails
      /*
            generatedInputs.currentTallyCommitment = hash3(
                [
                    poll.genResultsCommitment(BigInt(1)),
                    poll.genSpentVoiceCreditSubtotalCommitment(
                        BigInt(2),
                        1
                    ),
                    poll.genPerVOSpentVoiceCreditsCommitment(
                        BigInt(3),
                        1,
                    )
                ]
            ).toString()
            */

      function generateRandomIndex() {
        return Math.floor(Math.random() * (generatedInputs.currentResults.length - 1));
      }
      // Start the tally from non-zero value
      let randIdx = generateRandomIndex();
      while (randIdx === 0) {
        randIdx = generateRandomIndex();
      }

      generatedInputs.currentResults[randIdx] = "1";
      const witness = await circuit.calculateWitness(generatedInputs);
      await circuit.checkConstraints(witness);

      // for (let j = 0; j < messageBatchSize; j++){
      //     const curr = await getSignal(circuit, witness, `resultCalc[${randIdx}].nums[${j}]`)
      //     expect(Number(curr)).to.be.eq(0)
      // }

      // for (let i = 1; i < (5 ** treeDepths.voteOptionTreeDepth) * messageBatchSize; i++) {
      //     const voiceCreditSubtotal = await getSignal(circuit, witness, `newSpentVoiceCreditSubtotal.sums[${i}]`)

      //     if (i > (5 ** treeDepths.voteOptionTreeDepth) - 1) {
      //         expect(Number(voiceCreditSubtotal)).to.be.eq(Number(voteWeight) ** 2)
      //     } else {
      //         expect(Number(voiceCreditSubtotal)).to.be.eq(0)
      //     }
      // }
    });
  });

  const NUM_BATCHES = 2;
  const x = messageBatchSize * NUM_BATCHES;

  describe.skip(`${x} users, ${x} messages`, () => {
    it("should produce the correct state root and ballot root", async () => {
      const maciState = new MaciState(STATE_TREE_DEPTH);
      const userKeypairs: Keypair[] = [];
      for (let i = 0; i < x; i++) {
        const k = new Keypair();
        userKeypairs.push(k);
        maciState.signUp(k.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000) + duration));
      }

      maciState.stateAq.mergeSubRoots(0);
      maciState.stateAq.merge(STATE_TREE_DEPTH);

      const pollId = maciState.deployPoll(
        duration,
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      const poll = maciState.polls[pollId];

      const numMessages = messageBatchSize * NUM_BATCHES;
      for (let i = 0; i < numMessages; i++) {
        const command = new PCommand(
          BigInt(i),
          userKeypairs[i].pubKey,
          BigInt(i), //vote option index
          BigInt(1), // vote weight
          BigInt(1), // nonce
          BigInt(pollId),
        );

        const signature = command.sign(userKeypairs[i].privKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
        const message = command.encrypt(signature, sharedKey);
        poll.publishMessage(message, ecdhKeypair.pubKey);
      }

      poll.messageAq.mergeSubRoots(0);
      poll.messageAq.merge(treeDepths.messageTreeDepth);

      for (let i = 0; i < NUM_BATCHES; i++) {
        poll.processMessages(pollId);
      }

      for (let i = 0; i < NUM_BATCHES; i++) {
        const generatedInputs = poll.tallyVotes() as {
          currentResults: string[];
          currentSpentVoiceCreditSubtotal: string;
          currentPerVOSpentVoiceCredits: string[];
        };

        // For the 0th batch, the circuit should ignore currentResults,
        // currentSpentVoiceCreditSubtotal, and
        // currentPerVOSpentVoiceCredits
        if (i === 0) {
          generatedInputs.currentResults[0] = "123";
          generatedInputs.currentSpentVoiceCreditSubtotal = "456";
          generatedInputs.currentPerVOSpentVoiceCredits[0] = "789";
        }

        const witness = await circuit.calculateWitness(generatedInputs);
        await circuit.checkConstraints(witness);
      }
    });
  });
});
