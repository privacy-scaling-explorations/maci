/* eslint-disable no-await-in-loop */
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
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
  PollContracts,
} from "maci-cli";
import { MaciState, MaxValues, TreeDepths } from "maci-core";
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
import { ITestSuite, Subsidy } from "./utils/interfaces";
import { expectSubsidy, expectTally, genTestUserCommands, isArm } from "./utils/utils";

chai.use(chaiAsPromised);

const { expect } = chai;

/**
 * MACI Integration tests
 * @dev These tests use the cli code to perform full testing of the
 * protocol.
 */
describe("integration tests", function test() {
  this.timeout(10000000);

  // check on which system we are running
  const useWasm = isArm();

  // global variables we need shared between tests
  let maciState: MaciState;
  let contracts: DeployedContracts;
  let pollContracts: PollContracts;
  let pollId: number;
  const coordinatorKeypair = new Keypair();

  // the code that we run before all tests
  before(async () => {
    // 1. deploy Vk Registry
    const vkRegistryAddress = await deployVkRegistryContract(true);
    // 2. set verifying keys
    await setVerifyingKeys(
      STATE_TREE_DEPTH,
      INT_STATE_TREE_DEPTH,
      MSG_TREE_DEPTH,
      VOTE_OPTION_TREE_DEPTH,
      MSG_BATCH_DEPTH,
      path.resolve(__dirname, "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey"),
      path.resolve(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey"),
      vkRegistryAddress,
      path.resolve(__dirname, "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test.0.zkey"),
      true,
    );
  });

  // the code that we run before each test
  beforeEach(async () => {
    // create a new maci state
    maciState = new MaciState(STATE_TREE_DEPTH);

    // 3. deploy maci
    contracts = await deploy(STATE_TREE_DEPTH, initialVoiceCredits);

    // 4. create a poll
    pollContracts = await deployPoll(
      duration,
      25,
      25,
      INT_STATE_TREE_DEPTH,
      MSG_BATCH_DEPTH,
      MSG_TREE_DEPTH,
      VOTE_OPTION_TREE_DEPTH,
      coordinatorKeypair.pubKey.serialize(),
      true,
      contracts.maciAddress,
    );

    const treeDepths: TreeDepths = {
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageTreeDepth: MSG_TREE_DEPTH,
      messageTreeSubDepth: MSG_BATCH_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
    };

    const maxValues: MaxValues = {
      maxMessages: 25,
      maxVoteOptions: 25,
    };

    const messageBatchSize = 5 ** messageBatchDepth;

    pollId = maciState.deployPoll(
      BigInt(Date.now() + duration * 60000),
      maxValues,
      treeDepths,
      messageBatchSize,
      coordinatorKeypair,
    );
  });

  // after each test we need to cleanup some files
  afterEach(() => {
    if (fs.existsSync(path.resolve(__dirname, "../../../cli/tally.json"))) {
      fs.unlinkSync(path.resolve(__dirname, "../../../cli/tally.json"));
    }

    if (fs.existsSync(path.resolve(__dirname, "../../../cli/subsidy.json"))) {
      fs.unlinkSync(path.resolve(__dirname, "../../../cli/subsidy.json"));
    }

    const directory = path.resolve(__dirname, "../../../cli/proofs/");

    if (!fs.existsSync(directory)) {
      return;
    }

    fs.readdir(directory, (err, files) => {
      if (err) {
        throw err;
      }

      files.forEach((file) => {
        fs.unlinkSync(path.resolve(directory, file));
      });
    });
  });

  // read the test suite data
  const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, `./data/suites.json`)).toString()) as {
    suites: ITestSuite[];
  };

  data.suites.forEach((testCase) => {
    it(testCase.description, async () => {
      // check if we have subsidy enabled
      const subsidyEnabled = Boolean(testCase.subsidy?.enabled);

      const users = genTestUserCommands(testCase.numUsers, testCase.numVotesPerUser, testCase.bribers, testCase.votes);

      // loop through all users and generate keypair + signup
      for (let i = 0; i < users.length; i += 1) {
        const user = users[i];
        const timestamp = Date.now();
        // signup
        const stateIndex = await signup(
          user.keypair.pubKey.serialize(),
          contracts.maciAddress,
          SG_DATA,
          ivcpData,
          true,
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
          const salt = `0x${genRandomSalt().toString(16)}`;

          // store the previous keypair
          const oldKeypair = user.keypair;
          // change
          if (isKeyChange) {
            user.changeKeypair();
          }

          // actually publish it
          const encryptionKey = await publish(
            user.keypair.pubKey.serialize(),
            Number(stateIndex),
            voteOptionIndex!,
            nonce,
            pollId,
            newVoteWeight!,
            contracts.maciAddress,
            salt,
            // if it's a key change command, then we pass the old private key otherwise just pass the current
            isKeyChange ? oldKeypair.privKey.serialize() : user.keypair.privKey.serialize(),
            true,
          );

          const encPrivKey = PrivKey.deserialize(encryptionKey);
          const encPubKey = new PubKey(genPubKey(encPrivKey.rawPrivKey));

          // create the command to add to the local state
          const command = new PCommand(
            BigInt(stateIndex),
            user.keypair.pubKey,
            BigInt(voteOptionIndex!),
            BigInt(newVoteWeight!),
            BigInt(nonce),
            BigInt(pollId),
            BigInt(salt),
          );
          const signature = command.sign(isKeyChange ? oldKeypair.privKey : user.keypair.privKey);
          const message = command.encrypt(signature, Keypair.genEcdhSharedKey(encPrivKey, coordinatorKeypair.pubKey));
          maciState.polls[pollId].publishMessage(message, encPubKey);
        }
      }

      await timeTravel(duration, true);

      // merge messages
      await expect(mergeMessages(pollId, contracts.maciAddress, undefined, true)).to.eventually.not.be.rejectedWith();

      // merge signups
      await expect(mergeSignups(pollId, contracts.maciAddress, undefined, true)).to.eventually.not.be.rejectedWith();

      // generate proofs
      const tallyData = await genProofs(
        path.resolve(__dirname, "../../../cli/proofs"),
        path.resolve(__dirname, "../../../cli/tally.json"),
        path.resolve(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey"),
        path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey",
        ),
        pollId,
        path.resolve(__dirname, "../../../cli/subsidy.json"),
        path.resolve(__dirname, "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test.0.zkey"),
        `${homedir()}/rapidsnark/build/prover`,
        path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/ProcessMessages_10-2-1-2_test",
        ),
        path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/ProcessMessages_10-2-1-2_test.dat",
        ),
        path.resolve(
          __dirname,
          "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test",
        ),
        path.resolve(
          __dirname,
          "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test.dat",
        ),
        path.resolve(
          __dirname,
          "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/SubsidyPerBatch_10-1-2_test",
        ),
        path.resolve(
          __dirname,
          "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/SubsidyPerBatch_10-1-2_test.dat",
        ),
        coordinatorKeypair.privKey.serialize(),
        contracts.maciAddress,
        undefined,
        path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm",
        ),
        path.resolve(
          __dirname,
          "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm",
        ),
        path.resolve(
          __dirname,
          "../../../cli/zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_js/SubsidyPerBatch_10-1-2_test.wasm",
        ),
        useWasm,
      );
      expect(tallyData).to.not.eq(undefined);

      // verify that the data stored on the tally file is correct
      expectTally(
        maxMessages,
        testCase.expectedTally,
        testCase.expectedSpentVoiceCredits,
        testCase.expectedTotalSpentVoiceCredits,
        tallyData,
      );

      if (subsidyEnabled) {
        const subsidy = JSON.parse(
          fs.readFileSync(path.resolve(__dirname, "../../../cli/subsidy.json")).toString(),
        ) as Subsidy;
        expectSubsidy(maxMessages, testCase.subsidy?.expectedSubsidy ?? [], subsidy);
      }

      // prove on chain if everything matches
      await expect(
        proveOnChain(
          pollId.toString(),
          path.resolve(__dirname, "../../../cli/proofs"),
          subsidyEnabled,
          contracts.maciAddress,
          pollContracts.messageProcessor,
          pollContracts.tally,
          pollContracts.subsidy,
          true,
        ),
      ).to.eventually.not.rejectedWith();

      // verify the proofs
      await expect(
        verify(
          pollId.toString(),
          subsidyEnabled,
          path.resolve(__dirname, "../../../cli/tally.json"),
          tallyData,
          contracts.maciAddress,
          pollContracts.tally,
          pollContracts.subsidy,
          subsidyEnabled ? path.resolve(__dirname, "../../../cli/subsidy.json") : undefined,
          true,
        ),
      ).to.eventually.not.rejectedWith();
    });
  });
});
