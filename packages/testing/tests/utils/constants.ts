import { Keypair } from "maci-domainobjs";

import { homedir } from "os";

import { DeployArgs, DeployPollArgs, MergeSignupsArgs, ProveOnChainArgs, TallyData, VerifyArgs } from "maci-cli";

import { readJSONFile } from "../../ts/utils";
import { TimeTravelArgs } from "../../ts/types";

// this file contains all of the constants used in the integration tests
export const invalidVote = {
  voteWeight: 2n,
  nonce: 0n,
  maxVoteWeight: 1n,
  voteCreditBalance: 1n,
};
export const defaultVote = {
  voteWeight: 1n,
  nonce: 1n,
  maxVoteWeight: 25n,
  voteCreditBalance: 1n,
  voteOptionIndex: 0n,
};
export const SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const QUINARY_HASH_LENGTH = 5;
export const HASH_LENGTH = 2;
export const SUB_DEPTH = 2;
export const PROCESS_DEPTH = 4;
export const LEAVES_PER_NODE = 5;
export const NOTHING_UP_MY_SLEEVE = "8370432830353022751713833565135785980866757267633941821328460903436894336785";
export const ivcpData = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const maxUsers = 15;
export const maxMessages = 25;
export const maxVoteOptions = 25;
export const initialVoiceCredits = 1000;
export const signUpDuration = 120;
export const votingDuration = 120;
export const signUpDurationInSeconds = 3600;
export const votingDurationInSeconds = 3600;
export const tallyBatchSize = 4;
export const quadVoteTallyBatchSize = 4;
export const voteOptionsMaxLeafIndex = 3;
export const duration = 2000;
export const intStateTreeDepth = 1;
export const STATE_TREE_DEPTH = 10;
export const INT_STATE_TREE_DEPTH = 1;
export const VOTE_OPTION_TREE_DEPTH = 2;
export const MESSAGE_BATCH_SIZE = 20;

export const coordinatorKeypair = new Keypair();
export const coordinatorPubKey = coordinatorKeypair.pubKey.serialize();
export const coordinatorPrivKey = coordinatorKeypair.privKey.serialize();

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

export const pollDuration = 2000;

export const timeTravelArgs: Omit<TimeTravelArgs, "signer"> = {
  seconds: pollDuration,
};

export const mergeSignupsArgs: Omit<MergeSignupsArgs, "signer"> = {
  pollId: 0n,
};

export const proveOnChainArgs: Omit<ProveOnChainArgs, "signer"> = {
  pollId: 0n,
  tallyFile: testTallyFilePath,
  proofDir: testProofsDirPath,
};

export const verifyArgs = async (): Promise<Omit<VerifyArgs, "signer">> => {
  const tallyData = (await readJSONFile(testTallyFilePath)) as unknown as TallyData;

  return {
    pollId: 0n,
    tallyData,
    maciAddress: tallyData.maci,
  };
};

export const deployArgs: Omit<DeployArgs, "signer"> = {
  stateTreeDepth: STATE_TREE_DEPTH,
};

export const deployPollArgs: Omit<DeployPollArgs, "signer" | "pollStartDate" | "pollEndDate"> = {
  intStateTreeDepth: INT_STATE_TREE_DEPTH,
  messageBatchSize: MESSAGE_BATCH_SIZE,
  voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
  coordinatorPubkey: coordinatorPubKey,
  useQuadraticVoting: true,
};

// the default URL of the EVM provider
export const DEFAULT_ETH_PROVIDER = "http://127.0.0.1:8545";
// the default EVM private key
export const DEFAULT_ETH_SK = "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3";
// the default initial voice credits assigned to users
export const DEFAULT_INITIAL_VOICE_CREDITS = 99;
// the default signup gatekeeper data
export const DEFAULT_SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
// the default initial voice credit proxy data
export const DEFAULT_IVCP_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
