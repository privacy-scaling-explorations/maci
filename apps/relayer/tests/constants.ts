import { homedir } from "os";
import path from "path";
import { fileURLToPath } from "url";

import type request from "supertest";

export const STATE_TREE_DEPTH = 10;
export const TALLY_PROCESSING_STATE_TREE_DEPTH = 1;
export const VOTE_OPTION_TREE_DEPTH = 2;
export const MESSAGE_BATCH_SIZE = 20;
export const DEFAULT_INITIAL_VOICE_CREDITS = 99;
export const DEFAULT_VOTE_OPTIONS = 25;

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const root = path.resolve(dirname, "../../..");

export const pollJoiningZkey = path.resolve(root, "./zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey");
export const pollJoinedZkey = path.resolve(root, "./zkeys/PollJoined_10_test/PollJoined_10_test.0.zkey");
export const pollJoiningWasm = path.resolve(
  root,
  "./zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm",
);
export const pollWitnessGenerator = path.resolve(
  root,
  "./zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test",
);
export const pollJoinedWasm = path.resolve(
  root,
  "./zkeys/PollJoined_10_test/PollJoined_10_test_js/PollJoined_10_test.wasm",
);
export const pollJoinedWitnessGenerator = path.resolve(
  root,
  "./zkeys/PollJoined_10_test/PollJoined_10_test_cpp/PollJoined_10_test",
);
export const rapidsnark = `${homedir()}/rapidsnark/build/prover`;
export const messageProcessorZkeyPathNonQv = path.resolve(
  root,
  "./zkeys/MessageProcessorNonQv_10-20-2_test/MessageProcessorNonQv_10-20-2_test.0.zkey",
);
export const voteTallyZkeyPathNonQv = path.resolve(
  root,
  "./zkeys/VoteTallyNonQv_10-1-2_test/VoteTallyNonQv_10-1-2_test.0.zkey",
);

export type TApp = Parameters<typeof request>[0];
