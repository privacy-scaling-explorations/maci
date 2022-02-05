#!/bin/bash

set -e

help() {
    echo "Builds the batchUpdateTreeSnark and QuadTallySnark with custom parameters."
    echo
    echo "Syntax: buildCustomSnarks [-h|s|m|v|i|b]"
    echo
    echo "options: "
    echo "s State tree depth"
    echo "m Message tree depth"
    echo "v Vote options tree depth"
    echo "i Intermediate state tree depth ex. 2^i = Batch size"
    echo "b Batch size for update state tree"
    echo "c Build circom2 circuits with the rust compiler at given PATH"
}

bcircuitdir="./circom/prod/batchUpdateStateTree_custom.circom"
qcircuitdir="./circom/prod/quadVoteTally_custom.circom"

while getopts ":hs:m:v:i:b:c:" option; do
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
      i)
         istd="$OPTARG";;
      b)
         bs="$OPTARG";;
      c)
         circom_path="$OPTARG"
         bcircuitdir="./circom2/prod/batchUpdateStateTree_custom.circom"
         qcircuitdir="./circom2/prod/quadVoteTally_custom.circom"
         pragma="pragma circom 2.0.0;"
         echo $pragma > $bcircuitdir
         echo $pragma > $qcircuitdir
         ;;
     \?)
         echo "Error: Invalid option" 1>&2
         exit;;
   esac
done

cd "$(dirname "$0")"
cd ..
mkdir -p params

# Write custom circuit files
echo -e 'include "../batchUpdateStateTree.circom";\n' >> $bcircuitdir
echo "component main = BatchUpdateStateTree($std, $mtd, $votd, $bs);" >> $bcircuitdir

echo -e 'include "../quadVoteTally.circom";\n' >> $qcircuitdir
echo "component main = QuadVoteTally($std, $istd, $votd);" >> $qcircuitdir

echo "Building batchUpdateStateTree_custom"
echo "Building quadVoteTally_custom"

if [ -z "$circom_path" ]
then
    NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 build/buildSnarks.js -i $bcircuitdir -j params/batchUstCustom.r1cs -c params/batchUstCustom.c -y params/batchUstCustom.sym -p params/batchUstPkCustom.json -v params/batchUstVkCustom.json -s params/BatchUpdateStateTreeVerifierCustom.sol -vs BatchUpdateStateTreeVerifierCustom -pr params/batchUstCustom.params -w params/batchUstCustom -a params/batchUstCustom.wasm
    NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 build/buildSnarks.js -i $qcircuitdir -j params/qvtCircuitCustom.r1cs -c params/qvtCustom.c -y params/qvtCustom.sym -p params/qvtPkCustom.bin -v params/qvtVkCustom.json -s params/QuadVoteTallyVerifierCustom.sol -vs QuadVoteTallyVerifierCustom -pr params/qvtCustom.params -w params/qvtCustom -a params/qvtCustom.wasm
else
    NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 build/buildSnarks.js -i $bcircuitdir -j params/batchUstCustom.r1cs -c params/batchUstCustom.c -y params/batchUstCustom.sym -p params/batchUstPkCustom.json -v params/batchUstVkCustom.json -s params/BatchUpdateStateTreeVerifierCustom.sol -vs BatchUpdateStateTreeVerifierCustom -pr params/batchUstCustom.params -w params/batchUstCustom -a params/batchUstCustom.wasm -cc $circom_path
    NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 build/buildSnarks.js -i $qcircuitdir -j params/qvtCircuitCustom.r1cs -c params/qvtCustom.c -y params/qvtCustom.sym -p params/qvtPkCustom.bin -v params/qvtVkCustom.json -s params/QuadVoteTallyVerifierCustom.sol -vs QuadVoteTallyVerifierCustom -pr params/qvtCustom.params -w params/qvtCustom -a params/qvtCustom.wasm -cc $circom_path
fi

echo 'Copying BatchUpdateStateTreeVerifierCustom.sol to contracts/sol.'
cp ./params/BatchUpdateStateTreeVerifierCustom.sol ../contracts/sol/

echo 'Copying QuadVoteTallyVerifierCustom.sol to contracts/sol.'
cp ./params/QuadVoteTallyVerifierCustom.sol ../contracts/sol/

echo "Cleaning up..."
rm $bcircuitdir
rm $qcircuitdir
echo "Circuits deleted"
