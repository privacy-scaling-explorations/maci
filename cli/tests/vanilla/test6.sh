#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"

. "$BASE_DIR"/../prepare_test.sh

# 5 signups and 5 messages
clean

POLL_ID=0

init_maci
deploy_poll

$MACI_CLI signup \
    --pubkey macipk.014cc8ef5a0022da608efab55e891417be0a474ba70b912dc6c2e6acea1a1499

$MACI_CLI signup \
    --pubkey macipk.0b1ec710ee4cac976b027e2fdabd2647c6dc6389ca4168db09ce79b3688ab598

$MACI_CLI signup \
    --pubkey macipk.adfdafaa47e79c71995b4d9a6783e610098a28a79d96804034a1c7174a9b748c

$MACI_CLI signup \
    --pubkey macipk.bfd90ae77a492e527c7ba5e451cc03bc7706982b11c2e0ae35e380fb541b0e95

$MACI_CLI signup \
    --pubkey macipk.f7dc5da79e53d8e634f58506be11bc593f4d731834cbffc0fadff319215f8aad

$MACI_CLI publish \
    --privkey macisk.2d257e1ce4acac2dcd5d25b3802a0e64c7c27a6e8f76ba48f41c90a2c1f8bf2a \
    --pubkey macipk.014cc8ef5a0022da608efab55e891417be0a474ba70b912dc6c2e6acea1a1499 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"

$MACI_CLI publish \
    --privkey macisk.179b7213d423381d25f9ef8ba3040c9e1e8b785600ab3484d042c13bfe3e7b7b \
    --pubkey macipk.0b1ec710ee4cac976b027e2fdabd2647c6dc6389ca4168db09ce79b3688ab598 \
    --state-index 2 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"

$MACI_CLI publish \
    --privkey macisk.ce8ca954499a2e6ef89ba1f29b457f8cdfe7e2fd1f8b7baa33ecc7b1bb797f8 \
    --pubkey macipk.adfdafaa47e79c71995b4d9a6783e610098a28a79d96804034a1c7174a9b748c \
    --state-index 3 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"

$MACI_CLI publish \
    --privkey macisk.28c1c7bb2b081da17e82075264ec20d6a022fbd54e0a0568b94fcaaef45fe261 \
    --pubkey macipk.bfd90ae77a492e527c7ba5e451cc03bc7706982b11c2e0ae35e380fb541b0e95 \
    --state-index 4 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"

$MACI_CLI publish \
    --privkey macisk.1ee8e41c2b79b1a79659ccde72ed0e24b1ad97c7c550aaf8261defb46eb78343 \
    --pubkey macipk.f7dc5da79e53d8e634f58506be11bc593f4d731834cbffc0fadff319215f8aad \
    --state-index 5 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"


$MACI_CLI timeTravel \
    --seconds 90

gen_proofs "$POLL_ID"

prove_and_verify_on_chain "$POLL_ID"