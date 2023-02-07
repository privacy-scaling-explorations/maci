#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"

. "$BASE_DIR"/../prepare_test.sh enable_subsidy


sk1=macisk.14db4cdf1fb42bee444c83aed43c40db6b1a2c79fa1067332b09b5dff0df19c5
pk1=macipk.d30bf8402e7d731e86ccc6d24726446bba3ee18e8df013ebb0c96a5b14914da9

sk2=macisk.2044549fd073daf95bfed48ab0583a6cc5cea0f45e11885a2670e712409d739
pk2=macipk.7d7cc9967a05d54d723253be7e43de570e56eda8bc86cc299f7bdb410d92e41c
sk3=macisk.18843ce600faa1656c6d1fed25b08b2c39a9aa3081d3b12eccc162e59d576ba4
pk3=macipk.29ba2f405ed1636997e6bff15463d05a2021ca5a1711952cbb03e42cdd8f7f13
sk4=macisk.1caf1c938ccd81b7aa94da3279b2f2d7965c5095bd237a0f6ef0e54efa47b561
pk4=macipk.2f4bd0898d9ea4df8c902ff2e3aeb9750b8a2bc89f35171051cfd3ba668fbc0c
sk5=macisk.1be69bd4979ad867bca3b0f44507f972f0c4699b65b0bd2de09325965648685e
pk5=macipk.bd4c03ecd1b9799ca7ab6ec6309568d9f743c4128d5d7f43d8a17f8af0dae31d
sk6=macisk.209aee1fb40e7be06ca793d964166809baf5e51c8d6e11f9be21ba00b3030918
pk6=macipk.49ee4bfba86c36cb43e60772825b55a2209b52ff202d8caf091b6921e193a290
sk7=macisk.1bdea32b18062d6647346de9caa1c8e1b18de81fc144b1b556f51bc6a3c34d5f
pk7=macipk.d354c22572a0b53ced8561f9ab16abe0b8f7f98c2133757e93cdefd45fe1b192


# 9 signups and 1 message
clean
POLL_ID=0

init_maci
deploy_poll


$MACI_CLI signup \
    --pubkey $pk1
$MACI_CLI signup \
    --pubkey $pk2
$MACI_CLI signup \
    --pubkey $pk3
$MACI_CLI signup \
    --pubkey $pk4
$MACI_CLI signup \
    --pubkey $pk5
$MACI_CLI signup \
    --pubkey $pk6
$MACI_CLI signup \
    --pubkey $pk7  

$MACI_CLI publish \
    --pubkey $pk1 \
    --privkey $sk1 \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id "$POLL_ID"


$MACI_CLI timeTravel \
    --seconds 90

gen_proofs "$POLL_ID"

prove_and_verify_on_chain "$POLL_ID"

## Must merge first poll before create other polls


deploy_poll
deploy_poll

POLL_ID=1
$MACI_CLI publish \
    --pubkey $pk1 \
    --privkey $sk1 \
    --state-index 1 \
    --vote-option-index 1 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id "$POLL_ID"
$MACI_CLI publish \
    --pubkey $pk2 \
    --privkey $sk2 \
    --state-index 2 \
    --vote-option-index 2 \
    --new-vote-weight 2 \
    --nonce 1 \
    --poll-id "$POLL_ID"
$MACI_CLI publish \
    --pubkey $pk3 \
    --privkey $sk3 \
    --state-index 3 \
    --vote-option-index 3 \
    --new-vote-weight 3 \
    --nonce 1 \
    --poll-id "$POLL_ID"

POLL_ID=2
$MACI_CLI publish \
    --pubkey $pk1 \
    --privkey $sk1 \
    --state-index 1 \
    --vote-option-index 1 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id "$POLL_ID"
$MACI_CLI publish \
    --pubkey $pk2 \
    --privkey $sk2 \
    --state-index 2 \
    --vote-option-index 2 \
    --new-vote-weight 2 \
    --nonce 1 \
    --poll-id "$POLL_ID"
$MACI_CLI publish \
    --pubkey $pk5 \
    --privkey $sk5 \
    --state-index 5 \
    --vote-option-index 5 \
    --new-vote-weight 5 \
    --nonce 1 \
    --poll-id "$POLL_ID"

$MACI_CLI timeTravel \
    --seconds 90

clean

POLL_ID=2
gen_proofs "$POLL_ID"
prove_and_verify_on_chain "$POLL_ID"

clean

POLL_ID=1
gen_proofs "$POLL_ID"
prove_and_verify_on_chain "$POLL_ID"
