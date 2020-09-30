#!/bin/bash

set -e

cd "$(dirname "$0")"
cd ..
mkdir -p build

echo "Building batchUpdateStateTree_small"
NODE_OPTIONS=--max-old-space-size=16384 time node --stack-size=16384 build/buildSnarks.js -i circom/prod/batchUpdateStateTree_small.circom -j build/batchUstSmall.r1cs -w build/batchUstSmall.wasm -p build/batchUstPkSmall.json -v build/batchUstVkSmall.json -s build/BatchUpdateStateTreeVerifierSmall.sol -vs BatchUpdateStateTreeVerifierSmall -pr build/batchUstSmall.params

echo "Building quadVoteTally_small"
NODE_OPTIONS=--max-old-space-size=16384 time node --stack-size=16384 build/buildSnarks.js -i circom/prod/quadVoteTally_small.circom -j build/qvtCircuitSmall.r1cs -w build/qvtSmall.wasm -p build/qvtPkSmall.bin -v build/qvtVkSmall.json -s build/QuadVoteTallyVerifierSmall.sol -vs QuadVoteTallyVerifierSmall -pr build/qvtSmall.params

echo 'Copying BatchUpdateStateTreeVerifier.sol to contracts/sol.'
cp ./build/BatchUpdateStateTreeVerifierSmall.sol ../contracts/sol/

echo 'Copying QuadVoteTallyVerifier.sol to contracts/sol.'
cp ./build/QuadVoteTallyVerifierSmall.sol ../contracts/sol/
