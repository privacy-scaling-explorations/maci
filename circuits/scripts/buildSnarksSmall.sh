#!/bin/bash

set -e

cd "$(dirname "$0")"
cd ..
mkdir -p params

echo "Building batchUpdateStateTree_small"
NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 build/buildSnarks.js -i circom/prod/batchUpdateStateTree_small.circom -j params/batchUstSmall.r1cs -c params/batchUstSmall.c -y params/batchUstSmall.sym -p params/batchUstPkSmall.json -v params/batchUstVkSmall.json -s params/BatchUpdateStateTreeVerifierSmall.sol -vs BatchUpdateStateTreeVerifierSmall -pr params/batchUstSmall.params -w params/batchUstSmall -a params/batchUstSmall.wasm

echo "Building quadVoteTally_small"
NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 build/buildSnarks.js -i circom/prod/quadVoteTally_small.circom -j params/qvtCircuitSmall.r1cs -c params/qvtSmall.c -y params/qvtSmall.sym -p params/qvtPkSmall.bin -v params/qvtVkSmall.json -s params/QuadVoteTallyVerifierSmall.sol -vs QuadVoteTallyVerifierSmall -pr params/qvtSmall.params -w params/qvtSmall -a params/qvtSmall.wasm

echo 'Copying BatchUpdateStateTreeVerifierSmall.sol to contracts/sol.'
cp ./params/BatchUpdateStateTreeVerifierSmall.sol ../contracts/sol/

echo 'Copying QuadVoteTallyVerifierSmall.sol to contracts/sol.'
cp ./params/QuadVoteTallyVerifierSmall.sol ../contracts/sol/
