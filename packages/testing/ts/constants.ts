import { Keypair } from "@maci-protocol/domainobjs";
import {
  EMode,
  extractAllVerifyingKeys,
  generateTallyCommitments,
  getPollParams,
  type ICheckVerifyingKeysArgs,
  type IDeployPollArgs,
  type ISetVerifyingKeysArgs,
  type ITallyData,
  type IMergeSignupsArgs,
  type IVerifyArgs,
  type IProveOnChainArgs,
  type ITimeTravelArgs,
  type IDeployMaciArgs,
} from "@maci-protocol/sdk";

import { homedir } from "os";

import type { Signer } from "ethers";

import { readJSONFile } from "./utils";

export const STATE_TREE_DEPTH = 10;
export const POLL_STATE_TREE_DEPTH = 10;
export const TALLY_PROCESSING_STATE_TREE_DEPTH = 1;
export const VOTE_OPTION_TREE_DEPTH = 2;
export const MESSAGE_BATCH_SIZE = 20;
export const DEFAULT_INITIAL_VOICE_CREDITS = 100;
export const DEFAULT_VOTE_OPTIONS = 25;
export const DEFAULT_SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const DEFAULT_IVCP_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const coordinatorKeypair = new Keypair();
export const coordinatorPublicKey = coordinatorKeypair.publicKey.serialize();
export const coordinatorPrivateKey = coordinatorKeypair.privateKey.serialize();
export const pollDuration = 2000;
export const maxMessages = 25;
export const maxVoteOptions = 25;

export const testRapidsnarkPath = `${homedir()}/rapidsnark/build/prover`;
export const testTallyFilePath = "./tally.json";
export const testProofsDirPath = "./proofs";

// Poll joining paths
export const testPollJoiningZkeyPath = "./zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey";
export const testPollJoiningWitnessPath = "./zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test";
export const testPollJoiningWasmPath = "./zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm";

// Poll joined paths
export const testPollJoinedZkeyPath = "./zkeys/PollJoined_10_test/PollJoined_10_test.0.zkey";
export const testPollJoinedWitnessPath = "./zkeys/PollJoined_10_test/PollJoined_10_test_cpp/PollJoined_10_test";
export const testPollJoinedWasmPath = "./zkeys/PollJoined_10_test/PollJoined_10_test_js/PollJoined_10_test.wasm";

// Process messages QV paths
export const testProcessMessageZkeyPath = "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test.0.zkey";
export const testProcessMessagesWitnessPath =
  "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_cpp/ProcessMessages_10-20-2_test";
export const testProcessMessagesWitnessDatPath =
  "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_cpp/ProcessMessages_10-20-2_test.dat";
export const testProcessMessagesWasmPath =
  "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_js/ProcessMessages_10-20-2_test.wasm";

// Process messages ceremony QV paths
export const ceremonyProcessMessagesZkeyPath = "./zkeys/ProcessMessages_6-9-2-3/processMessages_6-9-2-3.zkey";
export const ceremonyProcessMessagesWitnessPath =
  "./zkeys/ProcessMessages_14-9-2-3/ProcessMessages_14-9-2-3_cpp/ProcessMessages_14-9-2-3";
export const ceremonyProcessMessagesDatPath =
  "./zkeys/ProcessMessages_14-9-2-3/ProcessMessages_14-9-2-3_cpp/ProcessMessages_14-9-2-3.dat";
export const ceremonyProcessMessagesWasmPath =
  "./zkeys/ProcessMessages_14-9-2-3/ProcessMessages_14-9-2-3_js/ProcessMessages_14-9-2-3.wasm";

// Process messages Non-QV paths
export const testProcessMessageNonQvZkeyPath =
  "./zkeys/ProcessMessagesNonQv_10-20-2_test/ProcessMessagesNonQv_10-20-2_test.0.zkey";
export const testProcessMessagesNonQvWitnessPath =
  "./zkeys/ProcessMessagesNonQv_10-20-2_test/ProcessMessagesNonQv_10-20-2_test_cpp/ProcessMessagesNonQv_10-20-2_test";
export const testProcessMessagesNonQvWitnessDatPath =
  "./zkeys/ProcessMessagesNonQv_10-20-2_test/ProcessMessagesNonQv_10-20-2_test_cpp/ProcessMessagesNonQv_10-20-2_test.dat";
export const testProcessMessagesNonQvWasmPath =
  "./zkeys/ProcessMessagesNonQv_10-20-2_test/ProcessMessagesNonQv_10-20-2_test_js/ProcessMessagesNonQv_10-20-2_test.wasm";

// Process messages ceremony Non-QV paths
export const ceremonyProcessMessagesNonQvZkeyPath =
  "./zkeys/ProcessMessagesNonQv_6-9-2-3/processMessagesNonQv_6-9-2-3.zkey";
export const ceremonyProcessMessagesNonQvWitnessPath =
  "./zkeys/ProcessMessagesNonQv_14-9-2-3/ProcessMessagesNonQv_14-9-2-3_cpp/ProcessMessagesNonQv_14-9-2-3";
export const ceremonyProcessMessagesNonQvDatPath =
  "./zkeys/ProcessMessagesNonQv_14-9-2-3/ProcessMessagesNonQv_14-9-2-3_cpp/ProcessMessagesNonQv_14-9-2-3.dat";
export const ceremonyProcessMessagesNonQvWasmPath =
  "./zkeys/ProcessMessagesNonQv_14-9-2-3/ProcessMessagesNonQv_14-9-2-3_js/ProcessMessagesNonQv_14-9-2-3.wasm";

// Process messages Full paths
export const testProcessMessageFullZkeyPath =
  "./zkeys/MessageProcessorFull_10-20-2_test/MessageProcessorFull_10-20-2_test.0.zkey";
export const testProcessMessagesFullWitnessPath =
  "./zkeys/MessageProcessorFull_10-20-2_test/MessageProcessorFull_10-20-2_test_cpp/MessageProcessorFull_10-20-2_test";
export const testProcessMessagesFullWitnessDatPath =
  "./zkeys/MessageProcessorFull_10-20-2_test/MessageProcessorFull_10-20-2_test_cpp/MessageProcessorFull_10-20-2_test.dat";
export const testProcessMessagesFullWasmPath =
  "./zkeys/MessageProcessorFull_10-20-2_test/MessageProcessorFull_10-20-2_test_js/MessageProcessorFull_10-20-2_test.wasm";

// Tally votes QV paths
export const testTallyVotesZkeyPath = "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey";
export const testTallyVotesWitnessPath =
  "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test";
export const testTallyVotesWitnessDatPath =
  "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test.dat";
export const testTallyVotesWasmPath =
  "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm";

// Tally votes ceremony QV paths
export const ceremonyTallyVotesZkeyPath = "./zkeys/TallyVotes_6-2-3/tallyVotes_6-2-3.zkey";
export const ceremonyTallyVotesWitnessPath = "./zkeys/TallyVotes_14-5-3/TallyVotes_14-5-3_cpp/TallyVotes_14-5-3";
export const ceremonyTallyVotesDatPath = "./zkeys/TallyVotes_14-5-3/TallyVotes_14-5-3_cpp/TallyVotes_14-5-3.dat";
export const ceremonyTallyVotesWasmPath = "./zkeys/TallyVotes_14-5-3/TallyVotes_14-5-3_js/TallyVotes_14-5-3.wasm";

// Tally votes Non-QV paths
export const testTallyVotesNonQvZkeyPath = "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey";
export const testTallyVotesNonQvWitnessPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test";
export const testTallyVotesNonQvWitnessDatPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test.dat";
export const testTallyVotesNonQvWasmPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_js/TallyVotesNonQv_10-1-2_test.wasm";

// Tally votes ceremony Non-QV paths
export const ceremonyTallyVotesNonQvZkeyPath = "./zkeys/TallyVotesNonQv_6-2-3/tallyVotesNonQv_6-2-3.zkey";
export const ceremonyTallyVotesNonQvWitnessPath =
  "./zkeys/TallyVotesNonQv_14-5-3/TallyVotesNonQv_14-5-3_cpp/TallyVotesNonQv_14-5-3";
export const ceremonyTallyVotesNonQvDatPath =
  "./zkeys/TallyVotesNonQv_14-5-3/TallyVotesNonQv_14-5-3_cpp/TallyVotesNonQv_14-5-3.dat";
export const ceremonyTallyVotesNonQvWasmPath =
  "./zkeys/TallyVotesNonQv_14-5-3/TallyVotesNonQv_14-5-3_js/TallyVotesNonQv_14-5-3.wasm";

// Tally votes Full paths
export const testTallyVotesFullZkeyPath = "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey";
export const testTallyVotesFullWitnessPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test";
export const testTallyVotesFullWitnessDatPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test.dat";
export const testTallyVotesFullWasmPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_js/TallyVotesNonQv_10-1-2_test.wasm";

export const checkVerifyingKeysArgs: Omit<ICheckVerifyingKeysArgs, "verifyingKeysRegistry" | "signer"> = {
  stateTreeDepth: STATE_TREE_DEPTH,
  tallyProcessingStateTreeDepth: TALLY_PROCESSING_STATE_TREE_DEPTH,
  voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
  messageBatchSize: MESSAGE_BATCH_SIZE,
  pollJoiningZkeyPath: testPollJoiningZkeyPath,
  pollJoinedZkeyPath: testPollJoinedZkeyPath,
  processMessagesZkeyPath: testProcessMessageZkeyPath,
  tallyVotesZkeyPath: testTallyVotesZkeyPath,
};

export const timeTravelArgs: Omit<ITimeTravelArgs, "signer"> = {
  seconds: pollDuration,
};

export const mergeSignupsArgs: Omit<IMergeSignupsArgs, "maciAddress" | "signer"> = {
  pollId: 0n,
};

export const proveOnChainArgs: Omit<IProveOnChainArgs, "maciAddress" | "signer"> = {
  pollId: 0n,
  tallyFile: testTallyFilePath,
  proofDir: testProofsDirPath,
};

export const verifyArgs = async (signer: Signer): Promise<IVerifyArgs> => {
  const tallyData = await readJSONFile<ITallyData>(testTallyFilePath);
  const pollParams = await getPollParams({ pollId: 0n, maciContractAddress: tallyData.maci, signer });
  const tallyCommitments = generateTallyCommitments({
    tallyData,
    voteOptionTreeDepth: pollParams.voteOptionTreeDepth,
  });

  return {
    pollId: 0n,
    tallyData,
    maciAddress: tallyData.maci,
    tallyCommitments,
    totalVoteOptions: tallyData.results.tally.length,
    voteOptionTreeDepth: pollParams.voteOptionTreeDepth,
    signer,
  };
};

const zkeysByMode = {
  [EMode.QV]: {
    processMessagesZkeyPath: testProcessMessageZkeyPath,
    tallyVotesZkeyPath: testTallyVotesZkeyPath,
  },
  [EMode.NON_QV]: {
    processMessagesZkeyPath: testProcessMessageNonQvZkeyPath,
    tallyVotesZkeyPath: testTallyVotesNonQvZkeyPath,
  },
  [EMode.FULL]: {
    processMessagesZkeyPath: testProcessMessageFullZkeyPath,
    tallyVotesZkeyPath: testTallyVotesFullZkeyPath,
  },
};

export const verifyingKeysArgs = async (
  signer: Signer,
  mode = EMode.QV,
): Promise<Omit<ISetVerifyingKeysArgs, "verifyingKeysRegistryAddress">> => {
  const { processMessagesZkeyPath, tallyVotesZkeyPath } = zkeysByMode[mode];
  const { pollJoiningVerifyingKey, pollJoinedVerifyingKey, processVerifyingKey, tallyVerifyingKey } =
    await extractAllVerifyingKeys({
      pollJoiningZkeyPath: testPollJoiningZkeyPath,
      pollJoinedZkeyPath: testPollJoinedZkeyPath,
      processMessagesZkeyPath,
      tallyVotesZkeyPath,
    });

  return {
    stateTreeDepth: STATE_TREE_DEPTH,
    pollStateTreeDepth: POLL_STATE_TREE_DEPTH,
    tallyProcessingStateTreeDepth: TALLY_PROCESSING_STATE_TREE_DEPTH,
    voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
    messageBatchSize: MESSAGE_BATCH_SIZE,
    pollJoiningVerifyingKey: pollJoiningVerifyingKey!,
    pollJoinedVerifyingKey: pollJoinedVerifyingKey!,
    processMessagesVerifyingKey: processVerifyingKey!,
    tallyVotesVerifyingKey: tallyVerifyingKey!,
    mode,
    signer,
  };
};

export const deployArgs: Omit<IDeployMaciArgs, "signer" | "signupPolicyAddress"> = {
  stateTreeDepth: STATE_TREE_DEPTH,
};

export const deployPollArgs: Omit<
  IDeployPollArgs,
  | "relayers"
  | "signer"
  | "pollStartTimestamp"
  | "pollEndTimestamp"
  | "maciAddress"
  | "verifierContractAddress"
  | "verifyingKeysRegistryContractAddress"
  | "policyContractAddress"
  | "initialVoiceCreditProxyContractAddress"
> = {
  tallyProcessingStateTreeDepth: TALLY_PROCESSING_STATE_TREE_DEPTH,
  messageBatchSize: MESSAGE_BATCH_SIZE,
  stateTreeDepth: POLL_STATE_TREE_DEPTH,
  voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
  coordinatorPublicKey: coordinatorKeypair.publicKey,
  initialVoiceCredits: DEFAULT_INITIAL_VOICE_CREDITS,
  mode: EMode.QV,
  voteOptions: DEFAULT_VOTE_OPTIONS,
};

export const invalidVote = {
  voteWeight: 2n,
  nonce: 0n,
  maxVoteWeight: 1n,
  voteCreditBalance: 1n,
};
