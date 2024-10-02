/* eslint-disable no-await-in-loop */
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { Signer } from "ethers";
import {
  deploy,
  deployPoll,
  deployVkRegistryContract,
  genProofs,
  mergeMessages,
  mergeSignups,
  proveOnChain,
  publish,
  setVerifyingKeys,
  signup,
  timeTravel,
  verify,
  DeployedContracts,
} from "maci-cli";
import { getDefaultSigner } from "maci-contracts";
import { MaciState, TreeDepths } from "maci-core";
import { genPubKey, genRandomSalt } from "maci-crypto";
import { Keypair, PCommand, PrivKey, PubKey } from "maci-domainobjs";

import fs from "fs";
import { homedir } from "os";
import path from "path";

import {
  INT_STATE_TREE_DEPTH,
  MSG_BATCH_DEPTH,
  MSG_TREE_DEPTH,
  SG_DATA,
  STATE_TREE_DEPTH,
  VOTE_OPTION_TREE_DEPTH,
  duration,
  initialVoiceCredits,
  ivcpData,
  maxMessages,
  messageBatchDepth,
} from "./utils/constants";
import { ITestSuite } from "./utils/interfaces";
import { expectTally, genTestUserCommands, isArm } from "./utils/utils";

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
  let maciState: MaciState;
  let contracts: DeployedContracts;
  let pollId: bigint;
  let signer: Signer;
  const coordinatorKeypair = new Keypair();

  // the code that we run before all tests
  before(async () => {
    signer = await getDefaultSigner();
    // 1. deploy Vk Registry
    const vkRegistryAddress = await deployVkRegistryContract({ signer });
    // 2. set verifying keys
    await setVerifyingKeys({
      stateTreeDepth: STATE_TREE_DEPTH,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageTreeDepth: MSG_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      messageBatchDepth: MSG_BATCH_DEPTH,
      processMessagesZkeyPathQv: path.resolve(
        __dirname,
        "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey",
      ),
      tallyVotesZkeyPathQv: path.resolve(
        __dirname,
        "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey",
      ),
      processMessagesZkeyPathNonQv: path.resolve(
        __dirname,
        "../../../cli/zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test.0.zkey",
      ),
      tallyVotesZkeyPathNonQv: path.resolve(
        __dirname,
        "../../../cli/zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey",
      ),
      vkRegistry: vkRegistryAddress,
      signer,
    });
  });

  // the code that we run before each test
  beforeEach(async () => {
    // create a new maci state
    maciState = new MaciState(STATE_TREE_DEPTH);

    // 3. deploy maci
    contracts = await deploy({ stateTreeDepth: STATE_TREE_DEPTH, initialVoiceCredits, signer });

    // 4. create a poll
    await deployPoll({
      pollDuration: duration,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageTreeSubDepth: MSG_BATCH_DEPTH,
      messageTreeDepth: MSG_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      coordinatorPubkey: coordinatorKeypair.pubKey.serialize(),
      maciAddress: contracts.maciAddress,
      signer,
      useQuadraticVoting: true,
    });

    const treeDepths: TreeDepths = {
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageTreeDepth: MSG_TREE_DEPTH,
      messageTreeSubDepth: MSG_BATCH_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
    };

    const messageBatchSize = 5 ** messageBatchDepth;

    pollId = maciState.deployPoll(
      BigInt(Date.now() + duration * 60000),
      treeDepths,
      messageBatchSize,
      coordinatorKeypair,
    );
  });

  // after each test we need to cleanup some files
  afterEach(async () => {
    if (fs.existsSync(path.resolve(__dirname, "../../../cli/tally.json"))) {
      await fs.promises.unlink(path.resolve(__dirname, "../../../cli/tally.json"));
    }

    const directory = path.resolve(__dirname, "../../../cli/proofs/");

    if (!fs.existsSync(directory)) {
      return;
    }

    const files = await fs.promises.readdir(directory);

    await Promise.all(files.map((file) => fs.promises.unlink(path.resolve(directory, file))));
  });

  // read the test suite data
  const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, `./data/suites.json`)).toString()) as {
    suites: ITestSuite[];
  };

  data.suites.forEach((testCase) => {
    it(testCase.description, async () => {
      const users = genTestUserCommands(testCase.numUsers, testCase.numVotesPerUser, testCase.bribers, testCase.votes);

      // loop through all users and generate keypair + signup
      for (let i = 0; i < users.length; i += 1) {
        const user = users[i];
        const timestamp = Date.now();
        // signup
        const stateIndex = BigInt(
          await signup({
            maciPubKey: user.keypair.pubKey.serialize(),
            maciAddress: contracts.maciAddress,
            sgDataArg: SG_DATA,
            ivcpDataArg: ivcpData,
            signer,
          }).then((result) => result.stateIndex),
        );

        // signup on local maci state
        maciState.signUp(user.keypair.pubKey, BigInt(initialVoiceCredits), BigInt(timestamp));

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

          // actually publish it
          const encryptionKey = await publish({
            pubkey: user.keypair.pubKey.serialize(),
            stateIndex,
            voteOptionIndex: voteOptionIndex!,
            nonce,
            pollId,
            newVoteWeight: newVoteWeight!,
            maciAddress: contracts.maciAddress,
            salt,
            // if it's a key change command, then we pass the old private key otherwise just pass the current
            privateKey: isKeyChange ? oldKeypair.privKey.serialize() : user.keypair.privKey.serialize(),
            signer,
          });

          const encPrivKey = PrivKey.deserialize(encryptionKey);
          const encPubKey = new PubKey(genPubKey(encPrivKey.rawPrivKey));

          // create the command to add to the local state
          const command = new PCommand(
            stateIndex,
            user.keypair.pubKey,
            voteOptionIndex!,
            newVoteWeight!,
            nonce,
            pollId,
            salt,
          );
          const signature = command.sign(isKeyChange ? oldKeypair.privKey : user.keypair.privKey);
          const message = command.encrypt(signature, Keypair.genEcdhSharedKey(encPrivKey, coordinatorKeypair.pubKey));
          maciState.polls.get(pollId)?.publishMessage(message, encPubKey);
        }
      }

      await timeTravel({ seconds: duration, signer });

      // merge messages
      await expect(
        mergeMessages({ pollId, maciAddress: contracts.maciAddress, signer }),
      ).to.eventually.not.be.rejectedWith();

      // merge signups
      await expect(
        mergeSignups({ pollId, maciAddress: contracts.maciAddress, signer }),
      ).to.eventually.not.be.rejectedWith();

      // generate proofs
      const tallyData = await genProofs({
        outputDir: path.resolve(__dirname, "../../../cli/proofs"),
        tallyFile: path.resolve(__dirname, "../../../cli/tally.json"),
        tallyZkey: path.resolve(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey"),
        processZkey: path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey",
        ),
        pollId,
        rapidsnark: `${homedir()}/rapidsnark/build/prover`,
        processWitgen: path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/ProcessMessages_10-2-1-2_test",
        ),
        processDatFile: path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/ProcessMessages_10-2-1-2_test.dat",
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
        maciAddress: contracts.maciAddress,
        processWasm: path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm",
        ),
        tallyWasm: path.resolve(
          __dirname,
          "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm",
        ),
        useWasm,
        useQuadraticVoting: true,
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
          maciAddress: contracts.maciAddress,
          signer,
        }),
      ).to.not.be.rejected;

      // verify the proofs
      await expect(
        verify({
          pollId,
          tallyData,
          maciAddress: contracts.maciAddress,
          signer,
        }),
      ).to.not.be.rejected;
    });
  });
});
