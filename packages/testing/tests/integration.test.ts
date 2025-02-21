/* eslint-disable no-await-in-loop */
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { Signer } from "ethers";
import {
  genProofs,
  mergeSignups,
  proveOnChain,
  publish,
<<<<<<< HEAD:packages/integrationTests/ts/__tests__/integration.test.ts
  setVerifyingKeysCli,
=======
  signup,
>>>>>>> f9935fe00 (refactor: create separate package for test suite):packages/testing/tests/integration.test.ts
  timeTravel,
  verify,
  DeployedContracts,
  joinPoll,
} from "maci-cli";
import { MaciState, VOTE_OPTION_TREE_ARITY } from "maci-core";
import { genPubKey, genRandomSalt, poseidon } from "maci-crypto";
import { Keypair, PCommand, PrivKey, PubKey } from "maci-domainobjs";
<<<<<<< HEAD:packages/integrationTests/ts/__tests__/integration.test.ts
import {
  cidToBytes32,
  createCidFromObject,
  generateVote,
  getBlockTimestamp,
  getDefaultSigner,
  relayMessages,
  signup,
} from "maci-sdk";
=======
import { cidToBytes32, createCidFromObject, generateVote, getDefaultSigner, relayMessages, isArm } from "maci-sdk";
>>>>>>> f9935fe00 (refactor: create separate package for test suite):packages/testing/tests/integration.test.ts

import fs from "fs";
import { homedir } from "os";
import path from "path";

import {
  SG_DATA,
  VOTE_OPTION_TREE_DEPTH,
  backupFolder,
  duration,
  initialVoiceCredits,
  maxMessages,
} from "./utils/constants";
import { ITestSuite } from "./utils/interfaces";
import { expectTally, genTestUserCommands, writeBackupFile } from "./utils/utils";

import { TestDeploy } from "../ts/testingClass";

chai.use(chaiAsPromised);

const { expect } = chai;

/**
 * MACI Integration tests
 * @dev These tests use the cli code to perform full testing of the
 * protocol.
 */
describe("Integration tests", function test() {
  this.timeout(10000000);

  // check on which system we are running
  const useWasm = isArm();

  // global variables we need shared between tests
  let signer: Signer;
  let testingClass: TestDeploy;
  const coordinatorKeypair = new Keypair();

  // the code that we run before all tests
  before(async () => {
    signer = await getDefaultSigner();
  });

  // the code that we run before each test
  beforeEach(async () => {
    testingClass = await TestDeploy.getInstance();
  });

  // after each test we need to cleanup some files
  afterEach(async () => {
    if (fs.existsSync(path.resolve(__dirname, "../../../cli/tally.json"))) {
      await fs.promises.unlink(path.resolve(__dirname, "../../../cli/tally.json"));
    }

    const proofDirectory = path.resolve(__dirname, "../../../cli/proofs/");

    if (!fs.existsSync(proofDirectory)) {
      return;
    }

    const files = await fs.promises.readdir(proofDirectory);

    await Promise.all(files.map((file) => fs.promises.unlink(path.resolve(proofDirectory, file))));

    if (fs.existsSync(backupFolder)) {
      await fs.promises.rm(backupFolder, { recursive: true, force: true });
    }
  });

  // read the test suite data
  const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, `./data/suites.json`)).toString()) as {
    suites: ITestSuite[];
  };

  data.suites.forEach((testCase) => {
    it(testCase.description, async () => {
      const users = genTestUserCommands(testCase.numUsers, testCase.numVotesPerUser, testCase.bribers, testCase.votes);

      const maciAddress = testingClass.contractsData.maciContractAddress!;
      const pollId = testingClass.contractsData.pollId!;
      const maciState = testingClass.contractsData.maciState!;

      // loop through all users and generate keypair + signup
      for (let i = 0; i < users.length; i += 1) {
        const user = users[i];
        const timestamp = Date.now();
        // signup
        const stateIndex = BigInt(
          await signup({
            maciPubKey: user.keypair.pubKey.serialize(),
<<<<<<< HEAD:packages/integrationTests/ts/__tests__/integration.test.ts
            maciAddress: contracts.maciAddress,
            sgData: SG_DATA,
=======
            maciAddress,
            sgDataArg: SG_DATA,
>>>>>>> f9935fe00 (refactor: create separate package for test suite):packages/testing/tests/integration.test.ts
            signer,
          }).then((result) => result.stateIndex),
        );

        await joinPoll({
          maciAddress,
          privateKey: user.keypair.privKey.serialize(),
          stateIndex,
          pollId,
          pollJoiningZkey: path.resolve(__dirname, "../../../cli/zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey"),
          useWasm: true,
          pollWasm: path.resolve(
            __dirname,
            "../../../cli/zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm",
          ),
          pollWitgen: path.resolve(
            __dirname,
            "../../../cli/zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test",
          ),
          rapidsnark: `${homedir()}/rapidsnark/build/prover`,
          signer,
          quiet: true,
        });

        // signup on local maci state
        maciState?.signUp(user.keypair.pubKey);

        // join the poll on local
        const inputNullifier = BigInt(user.keypair.privKey.asCircuitInputs());
        const nullifier = poseidon([inputNullifier]);
        const poll = maciState?.polls.get(pollId!);
        poll?.joinPoll(nullifier, user.keypair.pubKey, BigInt(initialVoiceCredits), BigInt(timestamp));

        // publish messages
        for (let j = 0; j < user.votes.length; j += 1) {
          const isKeyChange = testCase.changeUsersKeys && j in testCase.changeUsersKeys[i];
          const voteOptionIndex = isKeyChange
            ? testCase.changeUsersKeys?.[i][j].voteOptionIndex
            : user.votes[j].voteOptionIndex;
          const newVoteWeight = isKeyChange ? testCase.changeUsersKeys?.[i][j].voteWeight : user.votes[j].voteWeight;
          const { nonce } = user.votes[j];
          const salt = genRandomSalt();

          // store the previous keypair
          const oldKeypair = user.keypair;
          // change
          if (isKeyChange) {
            user.changeKeypair();
          }

          // Generate vote for relayer
          const vote = generateVote({
            pollId,
            voteOptionIndex: voteOptionIndex!,
            salt,
            nonce,
            privateKey: isKeyChange ? oldKeypair.privKey : user.keypair.privKey,
            stateIndex,
            voteWeight: newVoteWeight!,
            coordinatorPubKey: coordinatorKeypair.pubKey,
            maxVoteOption: BigInt(VOTE_OPTION_TREE_ARITY ** VOTE_OPTION_TREE_DEPTH),
            newPubKey: user.keypair.pubKey,
          });

          const messages = [
            {
              maciContractAddress: maciAddress,
              poll: Number(pollId),
              data: vote.message.data.map(String),
              publicKey: vote.ephemeralKeypair.pubKey.asArray().map(String),
              hash: vote.message.hash(vote.ephemeralKeypair.pubKey).toString(),
            },
          ];

          const cid = await createCidFromObject(messages);
          const ipfsHash = await cidToBytes32(cid);

          await writeBackupFile(ipfsHash, messages);

          // actually publish it
          const encryptionKey =
            nonce % 2n === 0n
              ? await publish({
                  pubkey: user.keypair.pubKey.serialize(),
                  stateIndex,
                  voteOptionIndex: voteOptionIndex!,
                  nonce,
                  pollId,
                  newVoteWeight: newVoteWeight!,
                  maciAddress,
                  salt,
                  // if it's a key change command, then we pass the old private key otherwise just pass the current
                  privateKey: isKeyChange ? oldKeypair.privKey.serialize() : user.keypair.privKey.serialize(),
                  signer,
                })
              : await relayMessages({
                  maciAddress,
                  ipfsHash,
                  messages,
                  pollId: Number(pollId),
                  signer,
                }).then(() => vote.ephemeralKeypair.privKey.serialize());

          const encPrivKey = PrivKey.deserialize(encryptionKey);
          const encPubKey = new PubKey(genPubKey(encPrivKey.rawPrivKey));

          // create the command to add to the local state
          const command = new PCommand(
            stateIndex,
            user.keypair.pubKey,
            voteOptionIndex!,
            newVoteWeight!,
            nonce,
            pollId!,
            salt,
          );
          const signature = command.sign(isKeyChange ? oldKeypair.privKey : user.keypair.privKey);
          const message = command.encrypt(signature, Keypair.genEcdhSharedKey(encPrivKey, coordinatorKeypair.pubKey));
          maciState?.polls.get(pollId!)?.publishMessage(message, encPubKey);
        }
      }

      await timeTravel({ seconds: duration, signer });

      // merge signups
      await expect(
        mergeSignups({ pollId: pollId!, maciAddress: maciAddress!, signer }),
      ).to.eventually.not.be.rejectedWith();

      const ipfsMessageBackupFiles = await fs.promises
        .readdir(backupFolder)
        .then((paths) => paths.map((filename) => path.resolve(backupFolder, filename)));

      // generate proofs
      const tallyData = await genProofs({
        outputDir: path.resolve(__dirname, "../../../cli/proofs"),
        tallyFile: path.resolve(__dirname, "../../../cli/tally.json"),
        tallyZkey: path.resolve(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey"),
        processZkey: path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test.0.zkey",
        ),
        pollId: pollId!,
        rapidsnark: `${homedir()}/rapidsnark/build/prover`,
        processWitgen: path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_cpp/ProcessMessages_10-20-2_test",
        ),
        processDatFile: path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_cpp/ProcessMessages_10-20-2_test.dat",
        ),
        tallyWitgen: path.resolve(
          __dirname,
          "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test",
        ),
        tallyDatFile: path.resolve(
          __dirname,
          "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test.dat",
        ),
        coordinatorPrivKey: coordinatorKeypair.privKey.serialize(),
        maciAddress: maciAddress!,
        processWasm: path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_js/ProcessMessages_10-20-2_test.wasm",
        ),
        tallyWasm: path.resolve(
          __dirname,
          "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm",
        ),
        useWasm,
        useQuadraticVoting: true,
        ipfsMessageBackupFiles,
        signer,
      });
      expect(tallyData).to.not.eq(undefined);

      // verify that the data stored on the tally file is correct
      expectTally(
        maxMessages,
        testCase.expectedTally,
        testCase.expectedSpentVoiceCredits,
        testCase.expectedTotalSpentVoiceCredits,
        tallyData,
      );

      // prove on chain if everything matches
      await expect(
        proveOnChain({
          pollId,
          tallyFile: path.resolve(__dirname, "../../../cli/tally.json"),
          proofDir: path.resolve(__dirname, "../../../cli/proofs"),
          maciAddress,
          signer,
        }),
      ).to.not.be.rejected;

      // verify the proofs
      await expect(
        verify({
          pollId,
          tallyData,
          maciAddress,
          signer,
        }),
      ).to.not.be.rejected;
    });
  });
});
