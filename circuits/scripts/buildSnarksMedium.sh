#!/bin/bash

set -e

cd "$(dirname "$0")"
cd ..
mkdir -p params

echo "Building batchUpdateStateTree_medium"
NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 build/buildSnarks.js -i circom/prod/batchUpdateStateTree_medium.circom -j params/batchUstMedium.r1cs -c params/batchUstMedium.c -y params/batchUstMedium.sym -p params/batchUstPkMedium.json -v params/batchUstVkMedium.json -s params/BatchUpdateStateTreeVerifierMedium.sol -vs BatchUpdateStateTreeVerifierMedium -pr params/batchUstMedium.params -w params/batchUstMedium -a params/batchUstMedium.wasm


echo "Building quadVoteTally_medium"
NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 build/buildSnarks.js -i circom/prod/quadVoteTally_medium.circom -j params/qvtCircuitMedium.r1cs -c params/qvtMedium.c -y params/qvtMedium.sym -p params/qvtPkMedium.bin -v params/qvtVkMedium.json -s params/QuadVoteTallyVerifierMedium.sol -vs QuadVoteTallyVerifierMedium -pr params/qvtMedium.params -w params/qvtMedium -a params/qvtMedium.wasm

echo 'Copying BatchUpdateStateTreeVerifierMedium.sol to contracts/sol.'
cp ./params/BatchUpdateStateTreeVerifierMedium.sol ../contracts/sol/

echo 'Copying QuadVoteTallyVerifierMedium.sol to contracts/sol.'
cp ./params/QuadVoteTallyVerifierMedium.sol ../contracts/sol/
