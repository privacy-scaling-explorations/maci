#!/bin/bash

set -e

cd "$(dirname "$0")"
cd ..
mkdir -p params

NODE_OPTIONS=--max-old-space-size=8192 node build/buildSnarks.js -i circom/test/batchUpdateStateTree_test.circom -j params/batchUstCircuit.r1cs -c params/batchUst.c -y params/batchUst.sym -p params/batchUstPk.json -v params/batchUstVk.json -s params/BatchUpdateStateTreeVerifier.sol -vs BatchUpdateStateTreeVerifier -pr params/batchUst.params -w params/batchUst -a params/batchUst.wasm

echo 'Copying BatchUpdateStateTreeVerifier.sol to contracts/sol.'
cp ./params/BatchUpdateStateTreeVerifier.sol ../contracts/sol/
