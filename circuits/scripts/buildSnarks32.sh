#!/bin/bash

set -e

cd "$(dirname "$0")"
cd ..
mkdir -p params

echo "Building batchUpdateStateTree_32"
NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 build/buildSnarks.js -i circom/prod/batchUpdateStateTree_32.circom -j params/batchUst32.r1cs -c params/batchUst32.c -y params/batchUst32.sym -p params/batchUstPk32.json -v params/batchUstVk32.json -s params/BatchUpdateStateTreeVerifier32.sol -vs BatchUpdateStateTreeVerifier32 -pr params/batchUst32.params -w params/batchUst32 -a params/batchUst32.wasm

echo "Building quadVoteTally_32"
NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1073741 build/buildSnarks.js -i circom/prod/quadVoteTally_32.circom -j params/qvtCircuit32.r1cs -c params/qvt32.c -y params/qvt32.sym -p params/qvtPk32.bin -v params/qvtVk32.json -s params/QuadVoteTallyVerifier32.sol -vs QuadVoteTallyVerifier32 -pr params/qvt32.params -w params/qvt32 -a params/qvt32.wasm

echo 'Copying BatchUpdateStateTreeVerifier32.sol to contracts/sol.'
cp ./params/BatchUpdateStateTreeVerifier32.sol ../contracts/sol/

echo 'Copying QuadVoteTallyVerifier32.sol to contracts/sol.'
cp ./params/QuadVoteTallyVerifier32.sol ../contracts/sol/
