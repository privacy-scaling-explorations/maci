#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"

ZKEYS_DIR="$BASE_DIR"/../../zkeys

ZKEYS_POSTFIX="test"

PROCESS_DEACTIVATION_MESSAGES_PARAMS="5-10_$ZKEYS_POSTFIX"

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

# --from-block since MACI deployed
$MACI_CLI confirmDeactivation \
    --poll-id $POLL_ID \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --from-block 0 \
    --batch-size 1 \

# key deactivation happens after original period 86400s from prepare_test.sh has expired 
$MACI_CLI timeTravel \
    --seconds 90000

# missing triggering of smart contract code to pass batches
$MACI_CLI completeDeactivation \
    --poll-id $POLL_ID \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --state-num-sr-queue-ops 1 \
    --deactivated-keys-num-sr-queue-ops 1 \
    --from-block 0 \
    --process-deactivation-witnessgen "$ZKEYS_DIR"/ProcessDeactivationMessages_"$PROCESS_DEACTIVATION_MESSAGES_PARAMS" \
    --process-deactivation-zkey "$ZKEYS_DIR"/ProcessDeactivationMessages_"$PROCESS_DEACTIVATION_MESSAGES_PARAMS".0.zkey \
    --rapidsnark ~/rapidsnark/build/prover \

# TODO: consider using genMaciKeypair instead of hardcoded key pairs

$MACI_CLI generateNewKey \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --privkey macisk.acd54022725c8cf56dcd392808e3c4d170100d9fba4009ef0e8173ffe17f2e0 \
    --state-index 1 \
    --salt 0x798D81BE4A9870C079B8DE539496AB95 \
    --poll-id $POLL_ID \
    --from-block 0 \
    --new-key-generation-witnessgen "$ZKEYS_DIR"/GenerateNewKey_"$NEW_KEY_GENERATION_PARAMS" \
    --process-deactivation-zkey "$ZKEYS_DIR"/GenerateNewKey_"$NEW_KEY_GENERATION".0.zkey \
    --rapidsnark ~/rapidsnark/build/prover \ 

$MACI_CLI publish \
    --pubkey macipk.e57109205d2b33b90db8421727a2d4fb91cdf3a8e050fbd12aa5a9f4045585a2 \
    --privkey macisk.acd54022725c8cf56dcd392808e3c4d170100d9fba4009ef0e8173ffe17f2e0 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI timeTravel \
    --seconds 90

gen_proofs "$POLL_ID"

prove_and_verify_on_chain "$POLL_ID"