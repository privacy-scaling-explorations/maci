#!/bin/bash

set -e

rargs=4
function checkargs {
    if [ $# -lt $rargs ]
    then
        help
        echo "Error: missing arguments" >&2
        exit 1
    fi
}

help() {
    echo "Builds the batchUpdateTreeSnark and QuadTallySnark with custom parameters."
    echo
    echo "Syntax: buildCustomSnarks [-h|s|m|v|i|b|l]"
    echo
    echo "options: "
    echo "s State tree depth"
    echo "m Message tree depth"
    echo "v Vote options tree depth"
    echo "b Batch size for update state tree"
    echo "l Set max-old-space-size for Node commands"
}

nl=16384
while getopts ":h:s:m:v:i:b:l:" option; do
   case $option in
      h)
         help
         exit;;
      s)
         std="$OPTARG";;
      m)
         mtd="$OPTARG";;
      v)
         votd="$OPTARG";;
      b)
         bs="$OPTARG";;
      l)
         nl="$OPTARG";;
     \?)
         echo "Error: Invalid option" 1>&2
         exit;;
   esac
done

checkargs $std $mtd $votd $bs

# Intermediate state tree depth should be 2^i = Batch size
istd=$(echo "l($bs)/l(2)" | bc -l | cut -d . -f1)

cd "$(dirname "$0")"
cd ..
mkdir -p params

bcircuitdir="./circom/prod/batchUpdateStateTree_custom.circom"
qcircuitdir="./circom/prod/quadVoteTally_custom.circom"

touch $bcircuitdir
touch $qcircuitdir

# Write custom circuit files
echo -e 'include "../batchUpdateStateTree.circom";\n' > $bcircuitdir
echo "component main = BatchUpdateStateTree($std, $mtd, $votd, $bs);" >> $bcircuitdir

echo -e 'include "../quadVoteTally.circom";\n' > $qcircuitdir
echo "component main = QuadVoteTally($std, $istd, $votd);" >> $qcircuitdir

echo "Building batchUpdateStateTree_custom"
NODE_OPTIONS=--max-old-space-size=$nl node --stack-size=1073741 build/buildSnarks.js -i circom/prod/batchUpdateStateTree_custom.circom -j params/batchUstCustom.r1cs -c params/batchUstCustom.c -y params/batchUstCustom.sym -p params/batchUstPkCustom.json -v params/batchUstVkCustom.json -s params/BatchUpdateStateTreeVerifierCustom.sol -vs BatchUpdateStateTreeVerifierCustom -pr params/batchUstCustom.params -w params/batchUstCustom -a params/batchUstCustom.wasm -ml $nl
echo "Building quadVoteTally_custom"
NODE_OPTIONS=--max-old-space-size=$nl node --stack-size=1073741 build/buildSnarks.js -i circom/prod/quadVoteTally_custom.circom -j params/qvtCircuitCustom.r1cs -c params/qvtCustom.c -y params/qvtCustom.sym -p params/qvtPkCustom.bin -v params/qvtVkCustom.json -s params/QuadVoteTallyVerifierCustom.sol -vs QuadVoteTallyVerifierCustom -pr params/qvtCustom.params -w params/qvtCustom -a params/qvtCustom.wasm -ml $nl

echo 'Copying BatchUpdateStateTreeVerifierCustom.sol to contracts/sol.'
cp ./params/BatchUpdateStateTreeVerifierCustom.sol ../contracts/sol/

echo 'Copying QuadVoteTallyVerifierCustom.sol to contracts/sol.'
cp ./params/QuadVoteTallyVerifierCustom.sol ../contracts/sol/
