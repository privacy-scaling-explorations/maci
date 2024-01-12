#! /bin/bash
# rm -r ./proofs
# rm tally.json
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js deployVkRegistry
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js setVerifyingKeys \
    --state-tree-depth 10 \
    --int-state-tree-depth 1 \
    --msg-tree-depth 2 \
    --vote-option-tree-depth 2 \
    --msg-batch-depth 1 \
    --process-messages-zkey ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-votes-zkey ./zkeys/TallyVotes_10-1-2_test.0.zkey
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js create -s 10
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js deployPoll \
    --pubkey macipk.ea638a3366ed91f2e955110888573861f7c0fc0bb5fb8b8dca9cd7a08d7d6b93 \
    -t 30 -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2 -se false
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js signup \
    --pubkey macipk.e743ffb5298ef0f5c1f63b6464a48fea19ea7ee5a885c67ae1b24a1d04f03f07 
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js publish \
    --pubkey macipk.e743ffb5298ef0f5c1f63b6464a48fea19ea7ee5a885c67ae1b24a1d04f03f07 \
    --privkey macisk.0ab0281365e01cff60afc62310daec765e590487bf989a7c4986ebc3fd49895e \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id 0
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js publish \
    --pubkey macipk.e743ffb5298ef0f5c1f63b6464a48fea19ea7ee5a885c67ae1b24a1d04f03f07 \
    --privkey macisk.0ab0281365e01cff60afc62310daec765e590487bf989a7c4986ebc3fd49895e \
    --state-index 1 \
    --vote-option-index 1 \
    --new-vote-weight 9 \
    --nonce 2 \
    --poll-id 0
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js timeTravel -s 100
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js mergeSignups --poll-id 0
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js mergeMessages --poll-id 0
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js genProofs \
    --privkey macisk.1751146b59d32e3c0d7426de411218172428263f93b2fc4d981c036047a4d8c0 \
    --poll-id 0 \
    --process-zkey ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-zkey ./zkeys/TallyVotes_10-1-2_test.0.zkey \
    --tally-file tally.json \
    --output proofs/ \
    -tw ./zkeys/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm \
    -pw ./zkeys/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm \
    -w true 
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js proveOnChain \
    --poll-id 0 \
    --proof-dir proofs/ \
    --subsidy-enabled false
HARDHAT_CONFIG=./build/hardhat.config.js node build/ts/index.js verify \
    --poll-id 0 \
    --subsidy-enabled false \
    --tally-file tally.json
