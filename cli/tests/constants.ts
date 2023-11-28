import { homedir } from "os";

export const STATE_TREE_DEPTH = 10;
export const INT_STATE_TREE_DEPTH = 1;
export const MSG_TREE_DEPTH = 2;
export const VOTE_OPTION_TREE_DEPTH = 2;
export const MSG_BATCH_DEPTH = 1;
export const coordinatorPubKey =
    "macipk.c974f4f168b79727ac98bfd53a65ea0b4e45dc2552fe73df9f8b51ebb0930330";
export const coordinatorPrivKey =
    "macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e";
export const processMessageTestZkeyPath =
    "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey";
export const tallyVotesTestZkeyPath = "./zkeys/TallyVotes_10-1-2_test.0.zkey";
export const subsidyTestZkeyPath = "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey";
export const testTallyFilePath = "./tally.json";
export const testSubsidyFilePath = "./subsidy.json";
export const testProofsDirPath = "./proofs";
export const testProcessMessagesWitnessPath =
    "./zkeys/ProcessMessages_10-2-1-2_test";
export const testTallyVotesWitnessPath = "./zkeys/TallyVotes_10-1-2_test";
export const testSubsidyWitnessPath = "./zkeys/SubsidyPerBatch_10-1-2_test";
export const testProcessMessagesWasmPath =
    "./zkeys/ProcessMessages_10-2-1-2_test.wasm";
export const testTallyVotesWasmPath = "./zkeys/TallyVotes_10-1-2_test.wasm";
export const testSubsidyWasmPath = "./zkeys/SubsidyPerBatch_10-1-2_test.wasm";
export const testRapidsnarkPath = `${homedir()}/rapidsnark/build/prover`;
