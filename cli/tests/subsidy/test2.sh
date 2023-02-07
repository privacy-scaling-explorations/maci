#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"

. "$BASE_DIR"/../prepare_test.sh enable_subsidy

# 4 signups and 6 valid message
clean

POLL_ID=0

init_maci
deploy_poll


$MACI_CLI signup \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e
$MACI_CLI signup \
    --pubkey macipk.6be0cedb8656b09ebb1af0bb691ba134620d0325366256bb8b543f83f6d6b811
$MACI_CLI signup \
    --pubkey macipk.8c3cb4d632cabb0ee2135e8e9f11189190b3fd317bf402ed7d0daf2ab6430a0f    
$MACI_CLI signup \
    --pubkey macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa


$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e --state-index 1 --vote-option-index 0 --new-vote-weight 1 --nonce 1 --poll-id "$POLL_ID"                 

$MACI_CLI publish \
    --privkey macisk.12b56eaf1cfb62afa850060f493744ca2d8afc4687ce8c1683fc26f31acf7b84  \
    --pubkey macipk.6be0cedb8656b09ebb1af0bb691ba134620d0325366256bb8b543f83f6d6b811 \
    --state-index 2 \
    --vote-option-index 1 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"                 

$MACI_CLI publish \
    --privkey macisk.6f6b490c3a08bf46a0f419d77058a633fad73e3f03d8113b499a649e57bb325 \
    --pubkey macipk.8c3cb4d632cabb0ee2135e8e9f11189190b3fd317bf402ed7d0daf2ab6430a0f \
    --state-index 3 \
    --vote-option-index 2 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"                  

$MACI_CLI publish \
    --privkey macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd \
    --pubkey macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa \
    --state-index 4 \
    --vote-option-index 3 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"

$MACI_CLI publish \
    --privkey macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd \
    --pubkey macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa \
    --state-index 4 \
    --vote-option-index 3 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"

$MACI_CLI publish \
    --privkey macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd \
    --pubkey macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa \
    --state-index 4 \
    --vote-option-index 3 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"


$MACI_CLI timeTravel \
    --seconds 90

gen_proofs "$POLL_ID"

prove_and_verify_on_chain "$POLL_ID"