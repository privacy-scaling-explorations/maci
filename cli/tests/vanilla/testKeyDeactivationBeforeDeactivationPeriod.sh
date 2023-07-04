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

# key deactivation happens before original period 86400s from prepare_test.sh has expired 
$MACI_CLI timeTravel \
    --seconds 10

KEY_DEACTIVATION_RESULT=$($MACI_CLI deactivateKey \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --state-index 1 \
    --nonce 1 \
    --salt 0x798D81BE4A9870C079B8DE539496AB95 \
    --poll-id "$POLL_ID")

echo $KEY_DEACTIVATION_RESULT

if [[ $KEY_DEACTIVATION_RESULT == *"Transaction hash"* ]]
then
  echo "Test Ok"
else
  echo "Test NOk"
fi