/* eslint-disable no-await-in-loop */
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { Signer } from "ethers";
import { deploy, DeployedContracts } from "maci-cli";
import { MaciState, TreeDepths, VOTE_OPTION_TREE_ARITY } from "maci-core";
import { genPubKey, genRandomSalt, poseidon } from "maci-crypto";
import { Keypair, PCommand, PrivKey, PubKey } from "maci-domainobjs";
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
} from "maci-sdk";

import fs from "fs";
import { homedir } from "os";
import path from "path";

import {
  DEFAULT_INITIAL_VOICE_CREDITS,
  DEFAULT_VOTE_OPTIONS,
  INT_STATE_TREE_DEPTH,
  MESSAGE_BATCH_SIZE,
  SG_DATA,
  STATE_TREE_DEPTH,
  VOTE_OPTION_TREE_DEPTH,
  backupFolder,
  duration,
  initialVoiceCredits,
  maxMessages,
  maxVoteOptions,
} from "./utils/constants";
import { ITestSuite } from "./utils/interfaces";
import { expectTally, genTestUserCommands, isArm, writeBackupFile } from "./utils/utils";

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

  let vkRegistryAddress: string;

  // the code that we run before all tests
  before(async () => {
    signer = await getDefaultSigner();
    // 1. deploy Vk Registry
    vkRegistryAddress = await deployVkRegistryContract({ signer });
    // 2. set verifying keys
    const { pollJoiningVk, pollJoinedVk, processVk, tallyVk } = await extractAllVks({
      pollJoiningZkeyPath: path.resolve(__dirname, "../../../cli/zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey"),
      pollJoinedZkeyPath: path.resolve(__dirname, "../../../cli/zkeys/PollJoined_10_test/PollJoined_10_test.0.zkey"),
      processMessagesZkeyPath: path.resolve(
        __dirname,
        "../../../cli/zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test.0.zkey",
      ),
      tallyVotesZkeyPath: path.resolve(
        __dirname,
        "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey",
      ),
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
    // create a new maci state
    maciState = new MaciState(STATE_TREE_DEPTH);

    // 3. deploy maci
    contracts = await deploy({ stateTreeDepth: STATE_TREE_DEPTH, initialVoiceCredits, signer });

    const startDate = await getBlockTimestamp(signer);

    // 4. create a poll
    await deployPoll({
      pollEndTimestamp: startDate + duration,
      pollStartTimestamp: startDate,
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      messageBatchSize: MESSAGE_BATCH_SIZE,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
      coordinatorPubKey: coordinatorKeypair.pubKey,
      maciAddress: contracts.maciAddress,
      signer,
      mode: EMode.QV,
      initialVoiceCreditProxyContractAddress: contracts.initialVoiceCreditProxyAddress,
      verifierContractAddress: contracts.verifierAddress,
      vkRegistryContractAddress: vkRegistryAddress,
      gatekeeperContractAddress: contracts.signUpGatekeeperAddress,
      voteOptions: DEFAULT_VOTE_OPTIONS,
      initialVoiceCredits: DEFAULT_INITIAL_VOICE_CREDITS,
      relayers: [await signer.getAddress()],
    });

    const treeDepths: TreeDepths = {
      intStateTreeDepth: INT_STATE_TREE_DEPTH,
      voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
    };

    const messageBatchSize = MESSAGE_BATCH_SIZE;

    pollId = maciState.deployPoll(
      BigInt(startDate + duration),
      treeDepths,
      messageBatchSize,
      coordinatorKeypair,
      BigInt(maxVoteOptions),
    );
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
            maciAddress: contracts.maciAddress,
            sgData: SG_DATA,
            signer,
          }).then((result) => result.stateIndex),
        );

        await joinPoll({
          maciAddress: contracts.maciAddress,
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
              maciContractAddress: contracts.maciAddress,
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
                  maciAddress: contracts.maciAddress,
                  salt,
                  // if it's a key change command, then we pass the old private key otherwise just pass the current
                  privateKey: isKeyChange ? oldKeypair.privKey.serialize() : user.keypair.privKey.serialize(),
                  signer,
                }).then(({ privateKey }) => privateKey)
              : await relayMessages({
                  maciAddress: contracts.maciAddress,
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

      await timeTravel({ seconds: duration, signer });

      // merge signups
      await expect(
        mergeSignups({ pollId, maciAddress: contracts.maciAddress, signer }),
      ).to.eventually.not.be.rejectedWith();

      const ipfsMessageBackupFiles = await fs.promises
        .readdir(backupFolder)
        .then((paths) => paths.map((filename) => path.resolve(backupFolder, filename)));

      // generate proofs
      const { tallyData } = await generateProofs({
        outputDir: path.resolve(__dirname, "../../../cli/proofs"),
        tallyFile: path.resolve(__dirname, "../../../cli/tally.json"),
        tallyZkey: path.resolve(__dirname, "../../../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey"),
        processZkey: path.resolve(
          __dirname,
          "../../../cli/zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test.0.zkey",
        ),
        pollId,
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
        coordinatorPrivateKey: coordinatorKeypair.privKey.serialize(),
        maciAddress: contracts.maciAddress,
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
          maciAddress: contracts.maciAddress,
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
          maciAddress: contracts.maciAddress,
          tallyCommitments,
          numVoteOptions: pollParams.numVoteOptions,
          voteOptionTreeDepth: pollParams.voteOptionTreeDepth,
          signer,
        }),
      ).to.not.be.rejected;
    });
  });
});
