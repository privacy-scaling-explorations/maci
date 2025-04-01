/* eslint-disable no-await-in-loop */
import { MaciState, TreeDepths, VOTE_OPTION_TREE_ARITY } from "@maci-protocol/core";
import { genPubKey, genRandomSalt, poseidon } from "@maci-protocol/crypto";
import { Keypair, PCommand, PrivKey, PubKey } from "@maci-protocol/domainobjs";
import {
  cidToBytes32,
  createCidFromObject,
  generateVote,
  getBlockTimestamp,
  getDefaultSigner,
  relayMessages,
  signup,
  mergeSignups,
  verify,
  generateTallyCommitments,
  getPollParams,
  setVerifyingKeys,
  EMode,
  extractAllVks,
  proveOnChain,
  joinPoll,
  publish,
  deployPoll,
  generateProofs,
  deployVkRegistryContract,
  timeTravel,
  deployMaci,
  type IMaciContracts,
  deployFreeForAllSignUpPolicy,
  deployConstantInitialVoiceCreditProxy,
  deployVerifier,
} from "@maci-protocol/sdk";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { Signer } from "ethers";

import fs from "fs";
import { homedir } from "os";
import path from "path";

import {
  DEFAULT_INITIAL_VOICE_CREDITS,
  DEFAULT_VOTE_OPTIONS,
  INT_STATE_TREE_DEPTH,
  MESSAGE_BATCH_SIZE,
  STATE_TREE_DEPTH,
  VOTE_OPTION_TREE_DEPTH,
  pollDuration,
  maxMessages,
  maxVoteOptions,
} from "../constants";
import { ITestSuite } from "../types";
import { expectTally, genTestUserCommands, isArm, writeBackupFile, backupFolder } from "../utils";

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
  let contracts: IMaciContracts;
  let pollId: bigint;
  let signer: Signer;
  const coordinatorKeypair = new Keypair();

  let vkRegistryAddress: string;

  // the code that we run before all tests
  before(async () => {
    signer = await getDefaultSigner();
    // 1. deploy Vk Registry
    vkRegistryAddress = await deployVkRegistryContract({ signer });
    // 2. set verifying keys
    const { pollJoiningVk, pollJoinedVk, processVk, tallyVk } = await extractAllVks({
      pollJoiningZkeyPath: "./zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey",
      pollJoinedZkeyPath: "./zkeys/PollJoined_10_test/PollJoined_10_test.0.zkey",
      processMessagesZkeyPath: "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test.0.zkey",
      tallyVotesZkeyPath: "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey",
    });

    await setVerifyingKeys({
      stateTreeDepth: STATE_TREE_DEPTH,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      mode: EMode.QV,
      pollJoiningVk: pollJoiningVk!,
      pollJoinedVk: pollJoinedVk!,
      processMessagesVk: processVk!,
      tallyVotesVk: tallyVk!,
      vkRegistryAddress,
      signer,
    });
  });

  // the code that we run before each test
  beforeEach(async () => {
    const [signUpPolicy] = await deployFreeForAllSignUpPolicy(signer, true);
    const signupPolicyAddress = await signUpPolicy.getAddress();

    const [pollPolicy] = await deployFreeForAllSignUpPolicy(signer, true);
    const pollPolicyAddress = await pollPolicy.getAddress();

    // create a new maci state
    maciState = new MaciState(STATE_TREE_DEPTH);

    // 3. deploy maci
    contracts = await deployMaci({
      stateTreeDepth: STATE_TREE_DEPTH,
      signupPolicyAddress,
      signer,
    });

    const [initialVoiceCreditProxy] = await deployConstantInitialVoiceCreditProxy(
      { amount: DEFAULT_INITIAL_VOICE_CREDITS },
      signer,
      undefined,
      true,
    );
    const initialVoiceCreditProxyContractAddress = await initialVoiceCreditProxy.getAddress();
    const verifier = await deployVerifier(signer, true);
    const verifierContractAddress = await verifier.getAddress();

    const startDate = await getBlockTimestamp(signer);

    // 4. create a poll
    await deployPoll({
      pollEndTimestamp: startDate + pollDuration,
      pollStartTimestamp: startDate,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      coordinatorPubKey: coordinatorKeypair.pubKey,
      maciAddress: contracts.maciContractAddress,
      signer,
      mode: EMode.QV,
      initialVoiceCreditProxyContractAddress,
      verifierContractAddress,
      vkRegistryContractAddress: vkRegistryAddress,
      policyContractAddress: pollPolicyAddress,
      initialVoiceCredits: DEFAULT_INITIAL_VOICE_CREDITS,
      voteOptions: DEFAULT_VOTE_OPTIONS,
      relayers: [await signer.getAddress()],
    });

    const treeDepths: TreeDepths = {
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
    };

    const messageBatchSize = MESSAGE_BATCH_SIZE;

    pollId = maciState.deployPoll(
      BigInt(startDate + pollDuration),
      treeDepths,
      messageBatchSize,
      coordinatorKeypair,
      BigInt(maxVoteOptions),
    );
  });

  // after each test we need to cleanup some files
  afterEach(async () => {
    if (fs.existsSync("./tally.json")) {
      await fs.promises.unlink("./tally.json");
    }

    const proofDirectory = "./proofs/";

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
    const DEFAULT_SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const DEFAULT_IVCP_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";

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
            maciAddress: contracts.maciContractAddress,
            sgData: DEFAULT_SG_DATA,
            signer,
          }).then((result) => result.stateIndex),
        );

        await joinPoll({
          maciAddress: contracts.maciContractAddress,
          privateKey: user.keypair.privKey.serialize(),
          stateIndex,
          pollId,
          pollJoiningZkey: "./zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey",
          useWasm: true,
          pollWasm: "./zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm",
          pollWitgen: "./zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test",
          rapidsnark: `${homedir()}/rapidsnark/build/prover`,
          sgDataArg: DEFAULT_SG_DATA,
          ivcpDataArg: DEFAULT_IVCP_DATA,
          signer,
        });

        // signup on local maci state
        maciState.signUp(user.keypair.pubKey);

        // join the poll on local
        const inputNullifier = BigInt(user.keypair.privKey.asCircuitInputs());
        const nullifier = poseidon([inputNullifier]);
        const poll = maciState.polls.get(pollId);
        poll?.joinPoll(nullifier, user.keypair.pubKey, BigInt(DEFAULT_INITIAL_VOICE_CREDITS), BigInt(timestamp));

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
              maciAddress: contracts.maciContractAddress,
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
                  maciAddress: contracts.maciContractAddress,
                  salt,
                  // if it's a key change command, then we pass the old private key otherwise just pass the current
                  privateKey: isKeyChange ? oldKeypair.privKey.serialize() : user.keypair.privKey.serialize(),
                  signer,
                }).then(({ privateKey }) => privateKey)
              : await relayMessages({
                  maciAddress: contracts.maciContractAddress,
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
            pollId,
            salt,
          );
          const signature = command.sign(isKeyChange ? oldKeypair.privKey : user.keypair.privKey);
          const message = command.encrypt(signature, Keypair.genEcdhSharedKey(encPrivKey, coordinatorKeypair.pubKey));
          maciState.polls.get(pollId)?.publishMessage(message, encPubKey);
        }
      }

      await timeTravel({ seconds: pollDuration, signer });

      // merge signups
      await expect(
        mergeSignups({ pollId, maciAddress: contracts.maciContractAddress, signer }),
      ).to.eventually.not.be.rejectedWith();

      const ipfsMessageBackupFiles = await fs.promises
        .readdir(backupFolder)
        .then((paths) => paths.map((filename) => path.resolve(backupFolder, filename)));

      // generate proofs
      const { tallyData } = await generateProofs({
        outputDir: "./proofs",
        tallyFile: "./tally.json",
        tallyZkey: "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey",
        processZkey: "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test.0.zkey",
        pollId,
        rapidsnark: `${homedir()}/rapidsnark/build/prover`,
        processWitgen:
          "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_cpp/ProcessMessages_10-20-2_test",
        processDatFile:
          "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_cpp/ProcessMessages_10-20-2_test.dat",
        tallyWitgen: "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test",
        tallyDatFile: "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test.dat",
        coordinatorPrivateKey: coordinatorKeypair.privKey.serialize(),
        maciAddress: contracts.maciContractAddress,
        processWasm:
          "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_js/ProcessMessages_10-20-2_test.wasm",
        tallyWasm: "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm",
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
          tallyFile: "./tally.json",
          proofDir: "./proofs",
          maciAddress: contracts.maciContractAddress,
          signer,
        }),
      ).to.not.be.rejected;

      const pollParams = await getPollParams({ pollId: 0n, maciContractAddress: tallyData.maci, signer });
      const tallyCommitments = generateTallyCommitments({
        tallyData,
        voteOptionTreeDepth: pollParams.voteOptionTreeDepth,
      });

      // verify the proofs
      await expect(
        verify({
          pollId,
          tallyData,
          maciAddress: contracts.maciContractAddress,
          tallyCommitments,
          numVoteOptions: pollParams.numVoteOptions,
          voteOptionTreeDepth: pollParams.voteOptionTreeDepth,
          signer,
        }),
      ).to.not.be.rejected;
    });
  });
});
