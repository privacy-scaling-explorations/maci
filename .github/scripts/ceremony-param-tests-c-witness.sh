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
    --process-messages-zkey ./zkeys/processMessages_6-8-2-3/processMessages_6-8-2-3.zkey \
    --tally-votes-zkey ./zkeys/tallyVotes_6-2-3/tallyVotes_6-2-3.zkey \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js create -s 6 -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js deployPoll \
    -pk macipk.ea638a3366ed91f2e955110888573861f7c0fc0bb5fb8b8dca9cd7a08d7d6b93 \
    --duration 300 \
    --max-messages 390625 \
    --max-vote-options 125 \
    --int-state-tree-depth 2 \
    --msg-tree-depth 8 \
    --msg-batch-depth 2 \
    --vote-option-tree-depth 3 \
    --subsidy-enabled false \
    -q true 
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js signup \
    --pubkey macipk.e743ffb5298ef0f5c1f63b6464a48fea19ea7ee5a885c67ae1b24a1d04f03f07 \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js publish \
    --pubkey macipk.e743ffb5298ef0f5c1f63b6464a48fea19ea7ee5a885c67ae1b24a1d04f03f07 \
    --privkey macisk.0ab0281365e01cff60afc62310daec765e590487bf989a7c4986ebc3fd49895e \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id 0 \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js publish \
    --pubkey macipk.e743ffb5298ef0f5c1f63b6464a48fea19ea7ee5a885c67ae1b24a1d04f03f07 \
    --privkey macisk.0ab0281365e01cff60afc62310daec765e590487bf989a7c4986ebc3fd49895e \
    --state-index 1 \
    --vote-option-index 1 \
    --new-vote-weight 9 \
    --nonce 2 \
    --poll-id 0 \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js timeTravel -s 300 -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js mergeSignups --poll-id 0 -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js mergeMessages --poll-id 0 -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js genProofs \
    --privkey macisk.1751146b59d32e3c0d7426de411218172428263f93b2fc4d981c036047a4d8c0 \
    --poll-id 0 \
    --rapidsnark ~/rapidsnark/build/prover \
    --process-zkey ./zkeys/processMessages_6-8-2-3/processMessages_6-8-2-3.zkey \
    --tally-zkey ./zkeys/tallyVotes_6-2-3/tallyVotes_6-2-3.zkey \
    --tally-file tally.json \
    --output proofs/ \
    --tally-witnessgen ./zkeys/tallyVotes_6-2-3/tallyVotes_6-2-3_cpp/tallyVotes_6-2-3 \
    --tally-witnessdat ./zkeys/tallyVotes_6-2-3/tallyVotes_6-2-3_cpp/tallyVotes_6-2-3.dat \
    --process-witnessgen ./zkeys/processMessages_6-8-2-3/processMessages_6-8-2-3_cpp/processMessages_6-8-2-3 \
    --process-witnessdat ./zkeys/processMessages_6-8-2-3/processMessages_6-8-2-3_cpp/processMessages_6-8-2-3.dat \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js proveOnChain \
    --poll-id 0 \
    --proof-dir proofs/ \
    --subsidy-enabled false \
    -q true
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js verify \
    --poll-id 0 \
    --subsidy-enabled false \
    --tally-file tally.json \
    -q true
