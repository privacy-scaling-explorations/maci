#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"

. "$BASE_DIR"/../prepare_test.sh

# 4 signups and 4 messages
clean

POLL_ID=0

init_maci
deploy_poll

$MACI_CLI signup \
    --pubkey macipk.4d8797043f3f54b9090cb7ddbb79a618297e3f94011e2d2b206dc05a52722498
$MACI_CLI signup \
    --pubkey macipk.e774ca3c13d4a4b4599c13ed7fb8f82b21181d7787c7a29e76d63283b229e123
$MACI_CLI signup \
    --pubkey macipk.1b3bb4ea01efad61877d04d8aa5fb2d3f509f75173be1411630cd7c47c02ea27
$MACI_CLI signup \
    --pubkey macipk.3a88d434c5c5a3ca15b849c8542087026f7890f73451429d57e75f4a3c9e7581

$MACI_CLI publish \
    --privkey macisk.295f450eacd883207b0eee91a95439bd45e3332b3f7ac13a1847fbed84f16bd1 \
    --pubkey macipk.4d8797043f3f54b9090cb7ddbb79a618297e3f94011e2d2b206dc05a52722498 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.1d30cdd3bb93910580e0c0718c45ec65b7ab2fa2e87c5ba6800612ab00c2175e \
    --pubkey macipk.e774ca3c13d4a4b4599c13ed7fb8f82b21181d7787c7a29e76d63283b229e123 \
    --state-index 2 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.10da10e0e9a5cc1a7a9505868940ca7d493eef6589b860e8de287a7f5d65dce1 \
    --pubkey macipk.1b3bb4ea01efad61877d04d8aa5fb2d3f509f75173be1411630cd7c47c02ea27 \
    --state-index 3 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.58dbcf4ee007b14856192fb336bba171fcb5a630f4954d49e49ac1d95af360e \
    --pubkey macipk.3a88d434c5c5a3ca15b849c8542087026f7890f73451429d57e75f4a3c9e7581 \
    --state-index 4 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    

$MACI_CLI timeTravel \
    --seconds 90

gen_proofs "$POLL_ID"

prove_and_verify_on_chain "$POLL_ID"