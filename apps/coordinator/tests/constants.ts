import { AbiCoder } from "ethers";

import { homedir } from "os";

export const pollJoiningTestZkeyPath = "./zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey";
export const testPollJoiningWasmPath = "./zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm";
export const testPollJoiningWitnessPath = "./zkeys/PollJoining_10_test/PollJoining_10_test_cpp/PollJoining_10_test";
export const testRapidsnarkPath = `${homedir()}/rapidsnark/build/prover`;

export const zeroUint256Encoded = AbiCoder.defaultAbiCoder().encode(["uint256"], [0]);
export const oneUint256Encoded = AbiCoder.defaultAbiCoder().encode(["uint256"], [1]);
