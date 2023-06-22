#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"

ZKEYS_DIR="$BASE_DIR"/../../zkeys

ZKEYS_POSTFIX="test"

PROCESS_MESSAGES_PARAMS="10-2-1-2_$ZKEYS_POSTFIX"

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
    --poll-id $POLL_ID

$MACI_CLI timeTravel \
    --seconds 10

# $MACI_CLI generateNewKey  \ add when implemented

# --from-block since MACI deployed
# --maci-address read from previous commands
# missing triggering of smart contract code to pass batches
$MACI_CLI confirmDeactivation \
    --maci-address 0x75c35C980C0d37ef46DF04d31A140b65503c0eEd \
    --poll-id $POLL_ID \
    --privkey macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
    --from-block 0 \
    --batch-size 1 \


# key deactivation happens after original period 86400s from prepare_test.sh has expired 
$MACI_CLI timeTravel \
    --seconds 90000

# missing triggering of smart contract code to pass batches
$MACI_CLI completeDeactivation \
    --maci-address 0x75c35C980C0d37ef46DF04d31A140b65503c0eEd \
    --poll-id $POLL_ID \
    --privkey macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
    --state-num-sr-queue-ops 1 \
    --deactivated-keys-num-sr-queue-ops 1 \
    --from-block 0 \
    --process-deactivation-witnessgen "$ZKEYS_DIR"/ProcessMessages_"$PROCESS_MESSAGES_PARAMS" \
    --process-deactivation-zkey "$ZKEYS_DIR"/ProcessMessages_"$PROCESS_MESSAGES_PARAMS".0.zkey \
    --rapidsnark ~/rapidsnark/build/prover \

