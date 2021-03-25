#!/bin/bash

set -e

cd "$(dirname "$0")"
cd ..
mkdir -p params

echo "Building batchUpdateStateTree_Large"
#NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 \
NODE_OPTIONS=--max-old-space-size=13000 node \
    --stack-size=1073741 \
    --trace-gc \
    --trace-gc-ignore-scavenger \
    --max-old-space-size=2048000 \
    --initial-old-space-size=2048000 \
    --no-global-gc-scheduling \
    --no-incremental-marking \
    --max-semi-space-size=1024 \
    --initial-heap-size=2048000 \
    build/buildSnarks.js -i circom/prod/batchUpdateStateTree_large.circom -j params/batchUstLarge.r1cs -c params/batchUstLarge.c -y params/batchUstLarge.sym -p params/batchUstPkLarge.json -v params/batchUstVkLarge.json -s params/BatchUpdateStateTreeVerifierLarge.sol -vs BatchUpdateStateTreeVerifierLarge -pr params/batchUstLarge.params -w params/batchUstLarge -a params/batchUstLarge.wasm


echo "Building quadVoteTally_Large"
#NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 \
NODE_OPTIONS=--max-old-space-size=16384 node \
    --stack-size=1073741 \
    --trace-gc \
    --trace-gc-ignore-scavenger \
    --max-old-space-size=2048000 \
    --initial-old-space-size=2048000 \
    --no-global-gc-scheduling \
    --no-incremental-marking \
    --max-semi-space-size=1024 \
    --initial-heap-size=2048000 \
    build/buildSnarks.js -i circom/prod/quadVoteTally_large.circom -j params/qvtCircuitLarge.r1cs -c params/qvtLarge.c -y params/qvtLarge.sym -p params/qvtPkLarge.bin -v params/qvtVkLarge.json -s params/QuadVoteTallyVerifierLarge.sol -vs QuadVoteTallyVerifierLarge -pr params/qvtLarge.params -w params/qvtLarge -a params/qvtLarge.wasm

echo 'Copying BatchUpdateStateTreeVerifierLarge.sol to contracts/sol.'
cp ./params/BatchUpdateStateTreeVerifierLarge.sol ../contracts/sol/

echo 'Copying QuadVoteTallyVerifierLarge.sol to contracts/sol.'
cp ./params/QuadVoteTallyVerifierLarge.sol ../contracts/sol/
