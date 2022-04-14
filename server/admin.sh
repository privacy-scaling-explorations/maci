#!/usr/bin/env bash

# linux: replace ip by docker gateway ip
export mongo_uri='mongodb://maci-coordinator:let-me-in@host.docker.internal'

ProgName=$(basename $0)
DirName=$(dirname $0)
CMD="cd $DirName/../cli && node build/index.js"
SCRIPT="node $DirName/admin.js"

#params for setVerifyingKey
state_tree_depth=10
int_state_tree_depth=1
msg_tree_depth=2
vote_option_tree_depth=2
msg_batch_depth=1
msg_zkey=$DirName"/../cli/zkeys/ProcessMessages_10-2-1-2_test.0.zkey"
tally_zkey=$DirName"/../cli/zkeys/TallyVotes_10-1-2_test.0.zkey"

#params for deployPoll
cordsk=macisk.27281729e0ece51695bd064eeb4215da20498e19bd4eeab75f83b99ed80226b5
cordpk=macipk.d49f1ed2fd22ca7e3bf96a5d3bcf245e6b440fc77cfa360ae50ff7b67990fb1e
duration=600 # in seconds
max_msgs=25
max_votes=25


help(){
    echo "admin.sh v1.0"
    echo "Usage: $ProgName <command> [options]"
    echo "commands:"
    echo "    deploy"
    echo "    store"
    echo "    process"
}

deploy(){
    echo "deploying smart contracts..."
    eval $CMD deployVkRegistry &&
    eval $CMD setVerifyingKeys -s $state_tree_depth -i $int_state_tree_depth -m $msg_tree_depth \
    -v $vote_option_tree_depth -b $msg_batch_depth  -p $msg_zkey -t $tally_zkey && \
    eval $CMD create && \
    eval $CMD deployPoll -pk $cordpk -t $duration -g $max_msgs -mv $max_votes \
                 -i $int_state_tree_depth -m $msg_tree_depth -v $vote_option_tree_depth -b $msg_batch_depth
}

store(){
    echo "store contract addresses and zkeys to database..."
    #$SCRIPT update -f $DirName"/../cli/contractAddress.txt"
    node admin.js update -f ../cli/contractAddress.txt -p $msg_zkey -t $tally_zkey
}



timeTravel(){
    eval $CMD timeTravel -s $duration
}

#params for merge
poll_id=0
merge(){
    echo "merge signup and messages ..."
    eval $CMD mergeMessages -o $poll_id
    eval $CMD mergeSignups -o $poll_id
}

# params for genProof
pid=0
prover="~/rapidsnark/build/prover"
pwitness=$DirName/../cli/zkeys/ProcessMessages_10-2-1-2_test
twitness=$DirName/../cli/zkeys/TallyVotes_10-1-2_test
pzkey=$DirName/../cli/zkeys/ProcessMessages_10-2-1-2_test.0.zkey
tzkey=$DirName/../cli/zkeys/TallyVotes_10-1-2_test.0.zkey
tally_file=$DirName/../cli/tally.json 
proof_dir=$DirName/../cli/proofs
txn="" # -tx $txn, where txn is the transaction hash of deployVkRegistry, optional
prove(){
    echo "genProof..."
    eval $CMD genProofs \
       -sk $cordsk \
       -o $pid \
       -r $prover \
       -wp $pwitness \
       -wt $twitness \
       -zp $pzkey \
       -zt $tzkey \
       -t  $tally_file \
       -f  $proof_dir
}

proveOnChain() {
    echo "prove on chain..."
    eval $CMD proveOnChain -o $pid -f $proof_dir
}

process(){
   timeTravel
   merge
   prove
   proveOnChain
}


command=$1
case $command in
    "" | "-h" | "--help")
        help
        ;;
    *)
        shift
        ${command} $@
        if [ $? = 127 ]; then
            echo "Error: '$command' is not a known subcommand." >&2
            echo "       Run '$ProgName -h' for a list of known subcommands." >&2
            exit 1
        fi
        ;;
esac
