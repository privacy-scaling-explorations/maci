import { AbiCoder } from "ethers";

import { homedir } from "os";
import path from "path";

const root = path.resolve(__dirname, "../../..");

export const pollJoiningTestZkeyPath = path.resolve(root, "./zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey");
export const testPollJoiningWasmPath = path.resolve(
  root,
  "./zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm",
);
export const testPollJoiningWitnessPath = path.resolve(
  root,
  "./zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test",
);
export const testRapidsnarkPath = `${homedir()}/rapidsnark/build/prover`;

export const zeroUint256Encoded = AbiCoder.defaultAbiCoder().encode(["uint256"], [0]);
export const oneUint256Encoded = AbiCoder.defaultAbiCoder().encode(["uint256"], [1]);
