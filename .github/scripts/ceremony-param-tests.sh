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
    --process-messages-zkey ./zkeys/processmessages_6-8-2-3_final.zkey \
    --tally-votes-zkey ./zkeys/tallyvotes_6-2-3_final.zkey \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js create -s 6 -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js deployPoll \
    -pk macipk.c974f4f168b79727ac98bfd53a65ea0b4e45dc2552fe73df9f8b51ebb0930330 \
    -t 30 -g 25 -mv 25 -i 2 -m 8 -b 2 -v 3 -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js signup \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js publish \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id 0 \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js publish \
    --pubkey macipk.d5788ea6ccf1ec295df99aaef859031fe7bd359e7e03acb80eb6e8a192f2ce19 \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
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
    --privkey macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
    --poll-id 0 \
    --rapidsnark ~/rapidsnark/build/prover \
    --process-zkey ./zkeys/processmessages_6-8-2-3_final.zkey \
    --tally-zkey ./zkeys/tallyvotes_6-2-3_final.zkey \
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
