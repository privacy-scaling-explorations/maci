#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"

. "$BASE_DIR"/../prepare_test.sh enable_subsidy

# 9 signups and 1 message
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
$MACI_CLI signup \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e
$MACI_CLI signup \
    --pubkey macipk.193c37dcb7db9bca854448e2b99b5d7e33e4c8a6f032e472a32578972e64031a
$MACI_CLI signup \
    --pubkey macipk.c380cb7b743da3ee6f72f847f3f8e0ab2a49fe4326547d1784555b04add4cc2c
$MACI_CLI signup \
    --pubkey macipk.4e1bdd5cbe0cfc9aa5b28cf0e7440932b689abd5e19072162495d312f3cc6525
$MACI_CLI signup \
    --pubkey macipk.e312ccfd650ae6319350b2fbd40f0900c0896fbd4bd03cebfb98f8c6df187096


$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"

$MACI_CLI timeTravel \
    --seconds 90

gen_proofs "$POLL_ID"

prove_and_verify_on_chain "$POLL_ID"