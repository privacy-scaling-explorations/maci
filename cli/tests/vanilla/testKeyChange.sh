#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"

. "$BASE_DIR"/../prepare_test.sh

# Test key-change

clean

POLL_ID=0

init_maci
deploy_poll

$MACI_CLI signup \
    --pubkey macipk.b8590fdba5e9cde5606dad5db384be4d253d0a2064d1e03f9600ee021a7ebe16 \

# Vote for option 0
$MACI_CLI publish \
    --pubkey macipk.b8590fdba5e9cde5606dad5db384be4d253d0a2064d1e03f9600ee021a7ebe16 \
    --privkey macisk.2ae4f199bf3925a2407f7c775c9261f351ab861d8e9ecbb84622bdd3f6d41b08 \
    --state-index 0 \
    --vote-option-index 0 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id "$POLL_ID"


# Change key:

# Private key: macisk.220b09bca39ddc56deaaecddcdf616529cd2ed3eeda2354795515f17894e1c65
# Public key:  macipk.b42b0da48010682d8c781d403f6b83db00c5e0970094ef3618393e7a3262c320

$MACI_CLI publish \
    --pubkey macipk.b42b0da48010682d8c781d403f6b83db00c5e0970094ef3618393e7a3262c320 \
    --privkey macisk.2ae4f199bf3925a2407f7c775c9261f351ab861d8e9ecbb84622bdd3f6d41b08 \
    --state-index 0 \
    --vote-option-index 0 \
    --new-vote-weight 0 \
    --nonce 1 \
    --poll-id "$POLL_ID"

# Vote for option 1 with new key

$MACI_CLI publish \
    --pubkey macipk.b42b0da48010682d8c781d403f6b83db00c5e0970094ef3618393e7a3262c320 \
    --privkey macisk.220b09bca39ddc56deaaecddcdf616529cd2ed3eeda2354795515f17894e1c65 \
    --state-index 0 \
    --vote-option-index 1 \
    --new-vote-weight 9 \
    --nonce 2 \
    --poll-id "$POLL_ID"

$MACI_CLI timeTravel \
    --seconds 90

gen_proofs "$POLL_ID"

prove_and_verify_on_chain "$POLL_ID"
