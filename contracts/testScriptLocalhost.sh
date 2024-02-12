#! /bin/bash

pnpm run deploy:localhost

pnpm run deploy-poll:localhost

sleep 30 # wait for voting period is over

pnpm run merge:localhost --poll 0

pnpm run prove:localhost --poll 0 \
    --coordinator-private-key "macisk.1751146b59d32e3c0d7426de411218172428263f93b2fc4d981c036047a4d8c0" \
    --process-zkey ../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-zkey ../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey \
    --tally-file ../cli/tally.json \
    --output-dir ../cli/proofs/ \
    --tally-wasm ../cli/zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm \
    --process-wasm ../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm
