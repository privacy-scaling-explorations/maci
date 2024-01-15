import { Keypair } from "maci-domainobjs";

import { homedir } from "os";

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
export const pollDuration = 90;
export const maxMessages = 25;
export const maxVoteOptions = 25;
