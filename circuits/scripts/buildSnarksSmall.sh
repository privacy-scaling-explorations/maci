#!/bin/bash

set -e

cd "$(dirname "$0")"
cd ..
mkdir -p build

echo "Building batchUpdateStateTree_small"
NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=16384 build/buildSnarks.js -i circom/prod/batchUpdateStateTree_small.circom -j build/batchUstsmall.r1cs -w build/batchUstSmall.wasm -p build/batchUstPkSmall.json -v build/batchUstVkSmall.json -s build/BatchUpdateStateTreeVerifier.sol -vs BatchUpdateStateTreeVerifier -z build/batchUstSmall.zkey

echo "Building quadVoteTally_small"
NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=16384 build/buildSnarks.js -i circom/prod/quadVoteTally_small.circom -j build/qvtCircuitSmall.r1cs -w build/qvtSmall.wasm -p build/qvtPkSmall.bin -v build/qvtVkSmall.json -s build/QuadVoteTallyVerifier.sol -vs QuadVoteTallyVerifier -z build/qvtSmall.zkey

echo 'Copying BatchUpdateStateTreeVerifier.sol to contracts/sol.'
cp ./build/BatchUpdateStateTreeVerifier.sol ../contracts/sol/
