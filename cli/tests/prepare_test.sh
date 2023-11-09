#!/bin/bash

set -e

BASE_DIR="$(dirname "$BASH_SOURCE")"
ZKEYS_DIR="$BASE_DIR"/../zkeys

MACI_CLI="node "$BASE_DIR"/../build/index.js"


ZKEYS_POSTFIX="test"

PROCESS_MESSAGES_PARAMS="10-2-1-2_$ZKEYS_POSTFIX"
TALLY_VOTES_PARAMS="10-1-2_$ZKEYS_POSTFIX"
SUBSIDY_PER_BATCH_PARAMS="10-1-2_$ZKEYS_POSTFIX"


init_maci() {
    $MACI_CLI deployVkRegistry

    $MACI_CLI setVerifyingKeys \
        --state-tree-depth 10 \
        --int-state-tree-depth 1 \
        --msg-tree-depth 2 \
        --vote-option-tree-depth 2 \
        --msg-batch-depth 1 \
        --process-messages-zkey "$ZKEYS_DIR"/ProcessMessages_"$PROCESS_MESSAGES_PARAMS".0.zkey \
        --tally-votes-zkey "$ZKEYS_DIR"/TallyVotes_"$TALLY_VOTES_PARAMS".0.zkey \
        $SET_VERIFYING_KEYS_FLAG_SUBSIDY

    $MACI_CLI create
}

deploy_poll() {
    $MACI_CLI deployPoll \
        --pubkey macipk.c974f4f168b79727ac98bfd53a65ea0b4e45dc2552fe73df9f8b51ebb0930330 \
        --duration 90 \
        --max-messages 25 \
        --max-vote-options 25 \
        --int-state-tree-depth 1 \
        --msg-tree-depth 2 \
        --msg_batch_depth 1 \
        --vote-option-tree-depth 2
}

clean() {
    rm -rf \
        proofs/ \
        tally.json \
        subsidy.json 
        
}

gen_proofs_pre_fetch() {
     echo "merge messages ..."
    $MACI_CLI mergeMessages \
        --poll-id $1
    
    echo "merge signups ..."
    $MACI_CLI mergeSignups \
        --poll-id $1

    echo "gen proofs ..."

    # generate the local state
    $MACI_CLI genLocalState \
        --poll-id $1 \
        --output localState.json \
        --privkey macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
        --num-blocks-per-request 50

    ARCH=$(uname -m)
    if [[ $ARCH == *"arm"* ]]; then
        # ARM parameters
        $MACI_CLI genProofs \
            --privkey macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
            --poll-id $1 \
            --process-wasm ./zkeys/ProcessMessages_"$PROCESS_MESSAGES_PARAMS"_js/ProcessMessages_"$PROCESS_MESSAGES_PARAMS".wasm \
            --tally-wasm ./zkeys/TallyVotes_"$TALLY_VOTES_PARAMS"_js/TallyVotes_"$TALLY_VOTES_PARAMS".wasm \
            --process-zkey "$ZKEYS_DIR"/ProcessMessages_"$PROCESS_MESSAGES_PARAMS".0.zkey \
            --tally-zkey "$ZKEYS_DIR"/TallyVotes_"$TALLY_VOTES_PARAMS".0.zkey \
            --tally-file tally.json \
            --output proofs/ \
            --state-file localState.json \
            $SUBSIDDY_OPTION_GEN_PROOFS
    else
        # Intel parameters
        $MACI_CLI genProofs \
            --privkey macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
            --poll-id $1 \
            --rapidsnark ~/rapidsnark/build/prover \
            --process-witnessgen ./zkeys/ProcessMessages_"$PROCESS_MESSAGES_PARAMS" \
            --tally-witnessgen ./zkeys/TallyVotes_"$TALLY_VOTES_PARAMS" \
            --process-zkey "$ZKEYS_DIR"/ProcessMessages_"$PROCESS_MESSAGES_PARAMS".0.zkey \
            --tally-zkey "$ZKEYS_DIR"/TallyVotes_"$TALLY_VOTES_PARAMS".0.zkey \
            --tally-file tally.json \
            --output proofs/ \
            --state-file localState.json \
            $SUBSIDDY_OPTION_GEN_PROOFS
    fi
}

gen_proofs() {
    echo "merge messages ..."
    $MACI_CLI mergeMessages \
        --poll-id $1
    
    echo "merge signups ..."
    $MACI_CLI mergeSignups \
        --poll-id $1

    echo "gen proofs ..."
    ARCH=$(uname -m)
    if [[ $ARCH == *"arm"* ]]; then
        # ARM parameters
        $MACI_CLI genProofs \
            --privkey macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
            --poll-id $1 \
            --process-wasm ./zkeys/ProcessMessages_"$PROCESS_MESSAGES_PARAMS"_js/ProcessMessages_"$PROCESS_MESSAGES_PARAMS".wasm \
            --tally-wasm ./zkeys/TallyVotes_"$TALLY_VOTES_PARAMS"_js/TallyVotes_"$TALLY_VOTES_PARAMS".wasm \
            --process-zkey "$ZKEYS_DIR"/ProcessMessages_"$PROCESS_MESSAGES_PARAMS".0.zkey \
            --tally-zkey "$ZKEYS_DIR"/TallyVotes_"$TALLY_VOTES_PARAMS".0.zkey \
            --tally-file tally.json \
            --output proofs/ \
            $SUBSIDDY_OPTION_GEN_PROOFS
    else
        # Intel parameters
        $MACI_CLI genProofs \
            --privkey macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
            --poll-id $1 \
            --rapidsnark ~/rapidsnark/build/prover \
            --process-witnessgen ./zkeys/ProcessMessages_"$PROCESS_MESSAGES_PARAMS" \
            --tally-witnessgen ./zkeys/TallyVotes_"$TALLY_VOTES_PARAMS" \
            --process-zkey "$ZKEYS_DIR"/ProcessMessages_"$PROCESS_MESSAGES_PARAMS".0.zkey \
            --tally-zkey "$ZKEYS_DIR"/TallyVotes_"$TALLY_VOTES_PARAMS".0.zkey \
            --tally-file tally.json \
            --output proofs/ \
            $SUBSIDDY_OPTION_GEN_PROOFS
    fi
}

prove_and_verify_on_chain() {
    echo "prove on chain ..."
    $MACI_CLI proveOnChain \
        --poll-id $1 \
        --proof-dir proofs/

    echo "verify on chain ..."
    $MACI_CLI verify \
        --poll-id $1 \
        --tally-file tally.json \
        $FLAG_SUBSIDY_PATH
}

SUBSIDY_ON="false"
set_subsidy_option() {
    if [ "${1}" == "enable_subsidy" ]; then
        echo "subsidy feature enabled ..."
        SUBSIDY_ON="true"
    fi

    # check architecture
    ARCH=$(uname -m)

    GEN_PROOFS_FLAG_SUBSIDY_WITNESS="--subsidy-witnessgen ./zkeys/SubsidyPerBatch_$SUBSIDY_PER_BATCH_PARAMS"
    GEN_PROOFS_FLAG_SUBSIDY_WASM="--subsidy-wasm ./zkeys/SubsidyPerBatch_"$SUBSIDY_PER_BATCH_PARAMS"_js/SubsidyPerBatch_"$SUBSIDY_PER_BATCH_PARAMS".wasm"
    GEN_PROOFS_FLAG_SUBSIDY_ZKEY="--subsidy-zkey "$ZKEYS_DIR"/SubsidyPerBatch_"$SUBSIDY_PER_BATCH_PARAMS".0.zkey"
    SUBSIDDY_OPTION_GEN_PROOFS=''
    SET_VERIFYING_KEYS_FLAG_SUBSIDY=''
    FLAG_SUBSIDY_PATH=''
    if [ "$SUBSIDY_ON" == "true" ]; then
        SET_VERIFYING_KEYS_FLAG_SUBSIDY="--subsidy-zkey "$ZKEYS_DIR"/SubsidyPerBatch_"$SUBSIDY_PER_BATCH_PARAMS".0.zkey"
        FLAG_SUBSIDY_PATH="--subsidy-file subsidy.json"
        if [[ $ARCH == *"arm"* ]]; then
            SUBSIDDY_OPTION_GEN_PROOFS="$GEN_PROOFS_FLAG_SUBSIDY_WASM $GEN_PROOFS_FLAG_SUBSIDY_ZKEY $FLAG_SUBSIDY_PATH"
        else
            SUBSIDDY_OPTION_GEN_PROOFS="$GEN_PROOFS_FLAG_SUBSIDY_WITNESS $GEN_PROOFS_FLAG_SUBSIDY_ZKEY $FLAG_SUBSIDY_PATH"
        fi    
    fi 
}

set_subsidy_option "${1}"
