#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"

. "$BASE_DIR"/../prepare_test.sh

# 1 signup and 1 message
clean

POLL_ID=0

init_maci
deploy_poll


$MACI_CLI signup \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391

# signup period
$MACI_CLI timeTravel \
    --seconds 100

$MACI_CLI deactivateKey \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --state-index 1 \
    --nonce 2 \
    --salt 0x798D81BE4A9870C079B8DE539496AB95 \
    --poll-id "$POLL_ID"

# key deactivation period
$MACI_CLI timeTravel \
    --seconds 10

# $MACI_CLI generateNewKey  \ add when implemented

# $MACI_CLI confirmDeactivation \ add when implemented

# this should fail until generateNewKey and confirmDeactivation are implemented. atm, user is trying to vote with deactivated key.

$MACI_CLI publish \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id "$POLL_ID"

$MACI_CLI timeTravel \
    --seconds 90

gen_proofs "$POLL_ID"

prove_and_verify_on_chain "$POLL_ID"
