#!/bin/bash

set -e

cd "$(dirname "$0")"
cd ../../cli

HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js deployVkRegistry -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js setVerifyingKeys \
    --state-tree-depth 6 \
    --int-state-tree-depth 2 \
    --msg-tree-depth 8 \
    --vote-option-tree-depth 3 \
    --msg-batch-depth 2 \
    --process-messages-zkey ./zkeys/processMessages_6-8-2-3.zkey \
    --tally-votes-zkey ./zkeys/tallyVotes_6-2-3.zkey \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js create -s 6 -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js deployPoll \
    -pk macipk.bca7ac038ea1a6e4cb45a142ebe6485670bdb1c34b5ba45257c4c7faed8efc14 \
    --duration 30 \
    --max-messages 390625 \
    --max-vote-options 125 \
    --int-state-tree-depth 2 \
    --msg-tree-depth 8 \
    --msg-batch-depth 2 \
    --vote-option-tree-depth 3 \
    -q true 
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js signup \
    --pubkey macipk.32c021243306d488fdc2aefa33c2093c1143e2baecb4b6fb04fba4c4abe972ae \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js publish \
    --pubkey macipk.32c021243306d488fdc2aefa33c2093c1143e2baecb4b6fb04fba4c4abe972ae \
    --privkey macisk.209ed243578af94e720ef7ca90067ad9089f01195269926e511f3fac4f32841 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id 0 \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js publish \
    --pubkey macipk.32c021243306d488fdc2aefa33c2093c1143e2baecb4b6fb04fba4c4abe972ae \
    --privkey macisk.209ed243578af94e720ef7ca90067ad9089f01195269926e511f3fac4f32841 \
    --state-index 1 \
    --vote-option-index 1 \
    --new-vote-weight 9 \
    --nonce 2 \
    --poll-id 0 \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js timeTravel -s 100 -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js mergeSignups --poll-id 0 -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js mergeMessages --poll-id 0 -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js genProofs \
    --privkey macisk.13035f1d0b35b0fe673c96586a4de84149c9539d8a03260a5fa333baaf45c11 \
    --poll-id 0 \
    --rapidsnark ~/rapidsnark/build/prover \
    --process-zkey ./zkeys/processMessages_6-8-2-3.zkey \
    --tally-zkey ./zkeys/tallyVotes_6-2-3.zkey \
    --tally-file tally.json \
    --output proofs/ \
    --tally-witnessgen ./zkeys/tallyVotes_6-2-3 \
    --process-witnessgen ./zkeys/processMessages_6-8-2-3 \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js proveOnChain \
    --poll-id 0 \
    --proof-dir proofs/ \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js verify \
    --poll-id 0 \
    --tally-file tally.json \
    -q true
