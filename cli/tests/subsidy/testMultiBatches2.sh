#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"

. "$BASE_DIR"/../prepare_test.sh enable_subsidy

# 4 signups and 4 messages
clean

POLL_ID=0

init_maci
deploy_poll


node ./build/index.js signup \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391  
node ./build/index.js signup \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391  
node ./build/index.js signup \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391  
node ./build/index.js signup \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391  


node build/index.js publish \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --state-index 3 \
    --vote-option-index 2 \
    --new-vote-weight 3 \
    --nonce 1 \
    --poll-id "$POLL_ID"

node build/index.js publish \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --state-index 2 \
    --vote-option-index 1 \
    --new-vote-weight 2 \
    --nonce 1 \
    --poll-id "$POLL_ID"

node build/index.js publish \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --state-index 1 \
    --vote-option-index 1 \
    --new-vote-weight 1 \
    --nonce 2 \
    --poll-id "$POLL_ID"

node build/index.js publish \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"


$MACI_CLI timeTravel \
    --seconds 90

gen_proofs "$POLL_ID"

prove_and_verify_on_chain "$POLL_ID"