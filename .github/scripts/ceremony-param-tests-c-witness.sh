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
    -pk macipk.4d9929621583dd9b8cac251fdc7bf58050330f37e1f407b327e711d5e32ba3a9 \
    --duration 30 \
    --max-messages 390625 \
    --max-vote-options 125 \
    --int-state-tree-depth 2 \
    --msg-tree-depth 8 \
    --msg-batch-depth 2 \
    --vote-option-tree-depth 3 \
    -q true 
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js signup \
    --pubkey macipk.5e304c40fbf7f84fe09b8a21b6d0454a9606fca1d34977e0b68b8e5fe1c9460a \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js publish \
    --pubkey macipk.5e304c40fbf7f84fe09b8a21b6d0454a9606fca1d34977e0b68b8e5fe1c9460a \
    --privkey macisk.251a97d4d2ffde8673102572e530d0293afdc3394e2db8fd5b3029ec00c7c739 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id 0 \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js publish \
    --pubkey macipk.5e304c40fbf7f84fe09b8a21b6d0454a9606fca1d34977e0b68b8e5fe1c9460a \
    --privkey macisk.251a97d4d2ffde8673102572e530d0293afdc3394e2db8fd5b3029ec00c7c739 \
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
    --privkey macisk.02115a4e210f81195aec6e6e9375bd1028f89dd873e6ee62bc5af298e13fd2e7 \
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
