#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"

. "$BASE_DIR"/../prepare_test.sh

# 8 signups and 10 messages
clean

POLL_ID=0

init_maci
deploy_poll

$MACI_CLI signup \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e

$MACI_CLI signup \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e

$MACI_CLI signup \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e

$MACI_CLI signup \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e

$MACI_CLI signup \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e

$MACI_CLI signup \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e

$MACI_CLI signup \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e

$MACI_CLI signup \
    --pubkey macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e


$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    
$MACI_CLI publish \
    --privkey macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa \
    --pubkey macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 1 \
    --nonce 1 \
    --poll-id "$POLL_ID"
    

$MACI_CLI timeTravel \
    --seconds 90

gen_proofs "$POLL_ID"

prove_and_verify_on_chain "$POLL_ID"