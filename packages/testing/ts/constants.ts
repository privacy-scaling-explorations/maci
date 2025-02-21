import { homedir } from "os";

export const STATE_TREE_DEPTH = 10;
export const INT_STATE_TREE_DEPTH = 1;
export const VOTE_OPTION_TREE_DEPTH = 2;
export const MESSAGE_BATCH_SIZE = 20;
export const VOTE_OPTIONS = 25;

export const DEFAULT_INITIAL_VOICE_CREDITS = 99;

export const backupFolder = "./backup";
export const pollJoiningTestZkeyPath = "./zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey";
export const pollJoinedTestZkeyPath = "./zkeys/PollJoined_10_test/PollJoined_10_test.0.zkey";
export const processMessageTestZkeyPath = "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test.0.zkey";
export const tallyVotesTestZkeyPath = "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey";
export const processMessageTestNonQvZkeyPath =
  "./zkeys/ProcessMessagesNonQv_10-20-2_test/ProcessMessagesNonQv_10-20-2_test.0.zkey";
export const tallyVotesTestNonQvZkeyPath = "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey";
export const testTallyFilePath = "./tally.json";
export const testProofsDirPath = "./proofs";
export const testPollJoiningWitnessPath = "./zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test";
export const testProcessMessagesWitnessPath =
  "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_cpp/ProcessMessages_10-20-2_test";
export const testProcessMessagesWitnessDatPath =
  "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_cpp/ProcessMessages_10-20-2_test.dat";
export const testTallyVotesWitnessPath =
  "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test";
export const testTallyVotesWitnessDatPath =
  "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_cpp/TallyVotes_10-1-2_test.dat";
export const testPollJoiningWasmPath = "./zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm";
export const testProcessMessagesWasmPath =
  "./zkeys/ProcessMessages_10-20-2_test/ProcessMessages_10-20-2_test_js/ProcessMessages_10-20-2_test.wasm";
export const testTallyVotesWasmPath =
  "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm";
export const testRapidsnarkPath = `${homedir()}/rapidsnark/build/prover`;
export const ceremonyPollJoiningZkeyPath = "./zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey";
export const ceremonyPollJoinedZkeyPath = "./zkeys/PollJoined_10_test/PollJoined_10_test.0.zkey";
export const ceremonyProcessMessagesZkeyPath = "./zkeys/ProcessMessages_6-9-2-3/processMessages_6-9-2-3.zkey";
export const ceremonyProcessMessagesNonQvZkeyPath =
  "./zkeys/ProcessMessagesNonQv_6-9-2-3/processMessagesNonQv_6-9-2-3.zkey";
export const ceremonyTallyVotesZkeyPath = "./zkeys/TallyVotes_6-2-3/tallyVotes_6-2-3.zkey";
export const ceremonyTallyVotesNonQvZkeyPath = "./zkeys/TallyVotesNonQv_6-2-3/tallyVotesNonQv_6-2-3.zkey";
export const ceremonyPollJoiningWitnessPath = "./zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test";
export const ceremonyProcessMessagesWitnessPath =
  "./zkeys/ProcessMessages_14-9-2-3/ProcessMessages_14-9-2-3_cpp/ProcessMessages_14-9-2-3";
export const ceremonyProcessMessagesNonQvWitnessPath =
  "./zkeys/ProcessMessagesNonQv_14-9-2-3/ProcessMessagesNonQv_14-9-2-3_cpp/ProcessMessagesNonQv_14-9-2-3";
export const ceremonyProcessMessagesDatPath =
  "./zkeys/ProcessMessages_14-9-2-3/ProcessMessages_14-9-2-3_cpp/ProcessMessages_14-9-2-3.dat";
export const ceremonyProcessMessagesNonQvDatPath =
  "./zkeys/ProcessMessagesNonQv_14-9-2-3/ProcessMessagesNonQv_14-9-2-3_cpp/ProcessMessagesNonQv_14-9-2-3.dat";
export const ceremonyTallyVotesWitnessPath = "./zkeys/TallyVotes_14-5-3/TallyVotes_14-5-3_cpp/TallyVotes_14-5-3";
export const ceremonyTallyVotesNonQvWitnessPath =
  "./zkeys/TallyVotesNonQv_14-5-3/TallyVotesNonQv_14-5-3_cpp/TallyVotesNonQv_14-5-3";
export const ceremonyTallyVotesDatPath = "./zkeys/TallyVotes_14-5-3/TallyVotes_14-5-3_cpp/TallyVotes_14-5-3.dat";
export const ceremonyTallyVotesNonQvDatPath =
  "./zkeys/TallyVotesNonQv_14-5-3/TallyVotesNonQv_14-5-3_cpp/TallyVotesNonQv_14-5-3.dat";
export const ceremonyProcessMessagesWasmPath =
  "./zkeys/ProcessMessages_14-9-2-3/ProcessMessages_14-9-2-3_js/ProcessMessages_14-9-2-3.wasm";
export const ceremonyProcessMessagesNonQvWasmPath =
  "./zkeys/ProcessMessagesNonQv_14-9-2-3/ProcessMessagesNonQv_14-9-2-3_js/ProcessMessagesNonQv_14-9-2-3.wasm";
export const ceremonyTallyVotesWasmPath = "./zkeys/TallyVotes_14-5-3/TallyVotes_14-5-3_js/TallyVotes_14-5-3.wasm";
export const ceremonyTallyVotesNonQvWasmPath =
  "./zkeys/TallyVotesNonQv_14-5-3/TallyVotesNonQv_14-5-3_js/TallyVotesNonQv_14-5-3.wasm";
export const testProcessMessagesNonQvWitnessPath =
  "./zkeys/ProcessMessagesNonQv_10-20-2_test/ProcessMessagesNonQv_10-20-2_test_cpp/ProcessMessagesNonQv_10-20-2_test";
export const testProcessMessagesNonQvWitnessDatPath =
  "./zkeys/ProcessMessagesNonQv_10-20-2_test/ProcessMessagesNonQv_10-20-2_test_cpp/ProcessMessagesNonQv_10-20-2_test.dat";
export const testTallyVotesNonQvWitnessPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test";
export const testTallyVotesNonQvWitnessDatPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_cpp/TallyVotesNonQv_10-1-2_test.dat";
export const testProcessMessagesNonQvWasmPath =
  "./zkeys/ProcessMessagesNonQv_10-20-2_test/ProcessMessagesNonQv_10-20-2_test_js/ProcessMessagesNonQv_10-20-2_test.wasm";
export const testTallyVotesNonQvWasmPath =
  "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test_js/TallyVotesNonQv_10-1-2_test.wasm";
