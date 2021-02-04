#!/bin/bash

set -e

cd "$(dirname "$0")"
cd ..
mkdir -p params

echo "Building batchUpdateStateTree_small"
NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=16384 build/buildSnarks.js -i circom/prod/batchUpdateStateTree_small.circom -j params/batchUstSmall.r1cs -w params/batchUstSmall.wasm -y params/batchUstSmall.sym -p params/batchUstPkSmall.json -v params/batchUstVkSmall.json -s params/BatchUpdateStateTreeVerifierSmall.sol -vs BatchUpdateStateTreeVerifierSmall -pr params/batchUstSmall.params

echo "Building quadVoteTally_small"
NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=16384 build/buildSnarks.js -i circom/prod/quadVoteTally_small.circom -j params/qvtCircuitSmall.r1cs -w params/qvtSmall.wasm -y params/qvtSmall.sym -p params/qvtPkSmall.bin -v params/qvtVkSmall.json -s params/QuadVoteTallyVerifierSmall.sol -vs QuadVoteTallyVerifierSmall -pr params/qvtSmall.params

echo 'Copying BatchUpdateStateTreeVerifier.sol to contracts/sol.'
cp ./params/BatchUpdateStateTreeVerifierSmall.sol ../contracts/sol/

echo 'Copying QuadVoteTallyVerifier.sol to contracts/sol.'
cp ./params/QuadVoteTallyVerifierSmall.sol ../contracts/sol/
