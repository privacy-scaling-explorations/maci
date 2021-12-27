#!/usr/bin/env bash

# linux: replace ip by docker gateway ip
export mongo_uri='mongodb://maci-coordinator:let-me-in@host.docker.internal'

ProgName=$(basename $0)
DirName=$(dirname $0)"/../../v0.10"
CliDirName=$(dirname $0)"/../../v0.10/cli"
CMD="cd $CliDirName && node build/index.js"

help(){
    echo "admin.sh v0.10"
    echo "Usage: $ProgName <command> [options]"
    echo "commands:"
    echo "    deploy"
    echo "    store"
    echo "    process"
}

# params for deploy
privkey=0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
cordsk=macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c
ethprovider="http://localhost:8545"
signup_duration=15
voting_duration=15
message_batch_size=4
tally_batch_size=4

deploy(){
    echo "deploying smart contracts..."
    eval $CMD create -d $privkey -sk $cordsk -e $ethprovider -s $signup_duration -o $voting_duration -bm $message_batch_size -bv $tally_batch_size
}

store(){
    echo "store contract addresses and zkeys to database..."
    node admin.js update -f $CliDirName/contractAddress.txt 
}

timeTravel(){
    duration=`expr $signup_duration + $voting_duration`
    eval $CMD timeTravel -s $duration
}

# params for genProof
maci=0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4
tally_file=$CliDirName/tally.json
proof_file=$CliDirName/proofs.json
maci_state=$CliDirName/macistate_test.json
prove(){
    echo "genProof..."
    eval $CMD genProofs -x $maci -sk $cordsk -o $proof_file -t $tally_file -m $maci_state
}

proveOnChain() {
    echo "prove on chain..."
    eval $CMD proveOnChain -x $maci -sk $cordsk -o $proof_file -d $privkey 
}

process(){
   timeTravel
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
