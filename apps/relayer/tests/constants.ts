import { homedir } from "os";
import path from "path";
import url from "url";

export const STATE_TREE_DEPTH = 10;
export const INT_STATE_TREE_DEPTH = 1;
export const VOTE_OPTION_TREE_DEPTH = 2;
export const MESSAGE_BATCH_SIZE = 20;

export const dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const pollJoiningZkey = path.resolve(dirname, "../zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey");
export const pollJoinedZkey = path.resolve(dirname, "../zkeys/PollJoined_10_test/PollJoined_10_test.0.zkey");
export const pollWasm = path.resolve(
  dirname,
  "../zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm",
);
export const pollWitgen = path.resolve(
  dirname,
  "../zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test",
);
export const pollJoinedWasm = path.resolve(
  dirname,
  "../zkeys/PollJoined_10_test/PollJoined_10_test_js/PollJoined_10_test.wasm",
);
export const pollJoinedWitgen = path.resolve(
  dirname,
  "../zkeys/PollJoined_10_test/PollJoined_10_test_cpp/PollJoined_10_test",
);
export const rapidsnark = `${homedir()}/rapidsnark/build/prover`;
export const processMessagesZkeyPathNonQv = path.resolve(
  dirname,
  "../zkeys/ProcessMessagesNonQv_10-20-2_test/ProcessMessagesNonQv_10-20-2_test.0.zkey",
);
export const tallyVotesZkeyPathNonQv = path.resolve(
  dirname,
  "../zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey",
);
