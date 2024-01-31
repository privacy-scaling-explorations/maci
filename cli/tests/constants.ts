import { Keypair } from "maci-domainobjs";

import { homedir } from "os";

import {
  CheckVerifyingKeysArgs,
  DeployArgs,
  DeployPollArgs,
  MergeMessagesArgs,
  MergeSignupsArgs,
  ProveOnChainArgs,
  SetVerifyingKeysArgs,
  TimeTravelArgs,
  VerifyArgs,
} from "../ts/utils";

export const STATE_TREE_DEPTH = 10;
export const INT_STATE_TREE_DEPTH = 1;
export const MSG_TREE_DEPTH = 2;
export const VOTE_OPTION_TREE_DEPTH = 2;
export const MSG_BATCH_DEPTH = 1;
const coordinatorKeypair = new Keypair();
export const coordinatorPubKey = coordinatorKeypair.pubKey.serialize();
export const coordinatorPrivKey = coordinatorKeypair.privKey.serialize();
export const processMessageTestZkeyPath = "./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey";
export const tallyVotesTestZkeyPath = "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey";
export const processMessageTestNonQvZkeyPath =
  "./zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test.0.zkey";
export const tallyVotesTestNonQvZkeyPath = "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey";
export const subsidyTestZkeyPath = "./zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test.0.zkey";
export const testTallyFilePath = "./tally.json";
export const testSubsidyFilePath = "./subsidy.json";
export const testProofsDirPath = "./proofs";
export const testProcessMessagesWitnessPath =
  "./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/ProcessMessages_10-2-1-2_test";
export const testProcessMessagesWitnessDatPath =
  "./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/ProcessMessages_10-2-1-2_test.dat";
export const testTallyVotesWitnessPath =
  "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test";
export const testTallyVotesWitnessDatPath =
  "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test.dat";
export const testSubsidyWitnessPath =
  "./zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/SubsidyPerBatch_10-1-2_test";
export const testSubsidyWitnessDatPath =
  "./zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_cpp/SubsidyPerBatch_10-1-2_test.dat";
export const testProcessMessagesWasmPath =
  "./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm";
export const testTallyVotesWasmPath =
  "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm";
export const testSubsidyWasmPath =
  "./zkeys/SubsidyPerBatch_10-1-2_test/SubsidyPerBatch_10-1-2_test_js/SubsidyPerBatch_10-1-2_test.wasm";
export const testRapidsnarkPath = `${homedir()}/rapidsnark/build/prover`;
export const ceremonyProcessMessageZkeyPath = "./zkeys/processMessages_6-8-2-3/processMessages_6-8-2-3.zkey";
export const ceremonyTallyVotesZkeyPath = "./zkeys/tallyVotes_6-2-3/tallyVotes_6-2-3.zkey";
export const cermeonyProcessMessagesWitnessPath =
  "./zkeys/processMessages_6-8-2-3/processMessages_6-8-2-3_cpp/processMessages_6-8-2-3";
export const ceremonyProcessMessagesDatPath =
  "./zkeys/processMessages_6-8-2-3/processMessages_6-8-2-3_cpp/processMessages_6-8-2-3.dat";
export const ceremonyTallyVotesWitnessPath = "./zkeys/tallyVotes_6-2-3/tallyVotes_6-2-3_cpp/tallyVotes_6-2-3";
export const ceremonyTallyVotesDatPath = "./zkeys/tallyVotes_6-2-3/tallyVotes_6-2-3_cpp/tallyVotes_6-2-3.dat";
export const ceremonyProcessMessagesWasmPath =
  "./zkeys/processMessages_6-8-2-3/processMessages_6-8-2-3_js/processMessages_6-8-2-3.wasm";
export const ceremonyTallyVotesWasmPath = "./zkeys/tallyVotes_6-2-3/tallyVotes_6-2-3_js/tallyVotes_6-2-3.wasm";
export const testProcessMessagesNonQvWitnessPath =
  "./zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/ProcessMessagesNonQv_10-2-1-2_test";
export const testProcessMessagesNonQvWitnessDatPath =
  "./zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_cpp/ProcessMessagesNonQv_10-2-1-2_test.dat";
export const testTallyVotesNonQvWitnessPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test";
export const testTallyVotesNonQvWitnessDatPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test.dat";
export const testProcessMessagesNonQvWasmPath =
  "./zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test_js/ProcessMessagesNonQv_10-2-1-2_test.wasm";
export const testTallyVotesNonQvWasmPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_js/TallyVotesNonQv_10-1-2_test.wasm";

export const pollDuration = 90;
export const maxMessages = 25;
export const maxVoteOptions = 25;

export const setVerifyingKeysArgs: SetVerifyingKeysArgs = {
  quiet: true,
  stateTreeDepth: STATE_TREE_DEPTH,
  intStateTreeDepth: INT_STATE_TREE_DEPTH,
  messageTreeDepth: MSG_TREE_DEPTH,
  voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
  messageBatchDepth: MSG_BATCH_DEPTH,
  processMessagesZkeyPath: processMessageTestZkeyPath,
  tallyVotesZkeyPath: tallyVotesTestZkeyPath,
};

export const setVerifyingKeysNonQvArgs: SetVerifyingKeysArgs = {
  quiet: true,
  stateTreeDepth: STATE_TREE_DEPTH,
  intStateTreeDepth: INT_STATE_TREE_DEPTH,
  messageTreeDepth: MSG_TREE_DEPTH,
  voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
  messageBatchDepth: MSG_BATCH_DEPTH,
  processMessagesZkeyPath: processMessageTestNonQvZkeyPath,
  tallyVotesZkeyPath: tallyVotesTestNonQvZkeyPath,
};

export const checkVerifyingKeysArgs: CheckVerifyingKeysArgs = {
  stateTreeDepth: STATE_TREE_DEPTH,
  intStateTreeDepth: INT_STATE_TREE_DEPTH,
  messageTreeDepth: MSG_TREE_DEPTH,
  voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
  messageBatchDepth: MSG_BATCH_DEPTH,
  processMessagesZkeyPath: processMessageTestZkeyPath,
  tallyVotesZkeyPath: tallyVotesTestZkeyPath,
};

export const timeTravelArgs: TimeTravelArgs = {
  seconds: pollDuration,
};

export const mergeMessagesArgs: MergeMessagesArgs = {
  pollId: 0n,
};

export const mergeSignupsArgs: MergeSignupsArgs = {
  pollId: 0n,
};

export const proveOnChainArgs: ProveOnChainArgs = {
  pollId: 0n,
  proofDir: testProofsDirPath,
  subsidyEnabled: false,
};

export const verifyArgs: VerifyArgs = {
  pollId: 0n,
  subsidyEnabled: false,
  tallyFile: testTallyFilePath,
};

export const deployArgs: DeployArgs = {
  stateTreeDepth: STATE_TREE_DEPTH,
};

export const deployPollArgs: DeployPollArgs = {
  pollDuration,
  intStateTreeDepth: INT_STATE_TREE_DEPTH,
  messageTreeSubDepth: MSG_BATCH_DEPTH,
  messageTreeDepth: MSG_TREE_DEPTH,
  voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
  coordinatorPubkey: coordinatorPubKey,
  subsidyEnabled: false,
};
