#!/usr/bin/env bash

# linux: replace ip by docker gateway ip
export mongo_uri='mongodb://maci-coordinator:let-me-in@172.18.0.1'

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
msg_zkey=$DirName"/../cli/zkeys/ProcessMessages_10-2-1-2.test.0.zkey"
tally_zkey=$DirName"/../cli/zkeys/TallyVotes_10-1-2.test.0.zkey"

#params for deployPoll
cordsk=macisk.27281729e0ece51695bd064eeb4215da20498e19bd4eeab75f83b99ed80226b5
cordpk=macipk.d49f1ed2fd22ca7e3bf96a5d3bcf245e6b440fc77cfa360ae50ff7b67990fb1e
duration=600 # in seconds
max_msgs=25
max_votes=25


help(){
    echo "Usage: $ProgName <command> [options]"
    echo "commands:"
    echo "    deploy"
    echo "    store"
    echo "    prove"
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

command=$1
case $command in
    "" | "-h" | "--help")
        help
        ;;
    "deploy")
        deploy
        ;;
    "store")
        store
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
