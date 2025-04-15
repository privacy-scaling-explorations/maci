import { Keypair } from "@maci-protocol/domainobjs";
import {
  EMode,
  extractAllVks,
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
import path from "path";

import type { Signer } from "ethers";

import { readJSONFile } from "./utils";

export const STATE_TREE_DEPTH = 10;
export const POLL_STATE_TREE_DEPTH = 10;
export const INT_STATE_TREE_DEPTH = 1;
export const VOTE_OPTION_TREE_DEPTH = 2;
export const MESSAGE_BATCH_SIZE = 20;
export const DEFAULT_INITIAL_VOICE_CREDITS = 100;
export const DEFAULT_VOTE_OPTIONS = 25;
export const DEFAULT_SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const DEFAULT_IVCP_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const coordinatorKeypair = new Keypair();
export const coordinatorPubKey = coordinatorKeypair.pubKey.serialize();
export const coordinatorPrivKey = coordinatorKeypair.privKey.serialize();
export const pollDuration = 2000;
export const maxMessages = 25;
export const maxVoteOptions = 25;

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

export const pollJoiningZkey = path.resolve(__dirname, "../zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey");
export const pollJoinedZkey = path.resolve(__dirname, "../zkeys/PollJoined_10_test/PollJoined_10_test.0.zkey");
export const pollWasm = path.resolve(
  __dirname,
  "../zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm",
);
export const pollWitgen = path.resolve(
  __dirname,
  "../zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test",
);
export const pollJoinedWasm = path.resolve(
  __dirname,
  "../zkeys/PollJoined_10_test/PollJoined_10_test_js/PollJoined_10_test.wasm",
);
export const pollJoinedWitgen = path.resolve(
  __dirname,
  "../zkeys/PollJoined_10_test/PollJoined_10_test_cpp/PollJoined_10_test",
);
export const rapidsnark = `${homedir()}/rapidsnark/build/prover`;
export const processMessagesZkeyPathNonQv = path.resolve(
  __dirname,
  "../zkeys/ProcessMessagesNonQv_10-20-2_test/ProcessMessagesNonQv_10-20-2_test.0.zkey",
);
export const tallyVotesZkeyPathNonQv = path.resolve(
  __dirname,
  "../zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey",
);

export const checkVerifyingKeysArgs: Omit<ICheckVerifyingKeysArgs, "vkRegistry" | "signer"> = {
  stateTreeDepth: STATE_TREE_DEPTH,
  intStateTreeDepth: INT_STATE_TREE_DEPTH,
  voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
  messageBatchSize: MESSAGE_BATCH_SIZE,
  pollJoiningZkeyPath: pollJoiningTestZkeyPath,
  pollJoinedZkeyPath: pollJoinedTestZkeyPath,
  processMessagesZkeyPath: processMessageTestZkeyPath,
  tallyVotesZkeyPath: tallyVotesTestZkeyPath,
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
    numVoteOptions: tallyData.results.tally.length,
    voteOptionTreeDepth: pollParams.voteOptionTreeDepth,
    signer,
  };
};

export const verifyingKeysArgs = async (
  signer: Signer,
  mode = EMode.QV,
): Promise<Omit<ISetVerifyingKeysArgs, "vkRegistryAddress">> => {
  const { pollJoiningVk, pollJoinedVk, processVk, tallyVk } = await extractAllVks({
    pollJoiningZkeyPath: pollJoiningTestZkeyPath,
    pollJoinedZkeyPath: pollJoinedTestZkeyPath,
    processMessagesZkeyPath: mode === EMode.QV ? processMessageTestZkeyPath : processMessageTestNonQvZkeyPath,
    tallyVotesZkeyPath: mode === EMode.QV ? tallyVotesTestZkeyPath : tallyVotesTestNonQvZkeyPath,
  });

  return {
    stateTreeDepth: STATE_TREE_DEPTH,
    pollStateTreeDepth: POLL_STATE_TREE_DEPTH,
    intStateTreeDepth: INT_STATE_TREE_DEPTH,
    voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
    messageBatchSize: MESSAGE_BATCH_SIZE,
    pollJoiningVk: pollJoiningVk!,
    pollJoinedVk: pollJoinedVk!,
    processMessagesVk: processVk!,
    tallyVotesVk: tallyVk!,
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
  | "vkRegistryContractAddress"
  | "policyContractAddress"
  | "initialVoiceCreditProxyContractAddress"
> = {
  intStateTreeDepth: INT_STATE_TREE_DEPTH,
  messageBatchSize: MESSAGE_BATCH_SIZE,
  stateTreeDepth: POLL_STATE_TREE_DEPTH,
  voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
  coordinatorPubKey: coordinatorKeypair.pubKey,
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
