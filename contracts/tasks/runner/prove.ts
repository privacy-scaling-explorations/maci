/* eslint-disable no-console */
import { task } from "hardhat/config";

// node build/ts/index.js genProofs \
//     --privkey macisk.1751146b59d32e3c0d7426de411218172428263f93b2fc4d981c036047a4d8c0 \
//     --poll-id 0 \
//     --process-zkey ./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey \
//     --tally-zkey ./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey \
//     --tally-file tally.json \
//     --output proofs/ \
//     -tw ./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm \
//     -pw ./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm \
//     -w true \
//     -q false
// node build/ts/index.js proveOnChain \
//     --poll-id 0 \
//     --proof-dir proofs/ \
//     --subsidy-enabled false

task("prove", "Command to generate proof and prove the result of a poll on-chain").setAction(async () => {
  // TODO: implement
});
