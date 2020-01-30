#!/bin/bash

cd "$(dirname "$0")"
cd ..
mkdir -p build

node build/buildSnarks.js -i circom/prod/batchUpdateStateTreeVerifier.circom -j build/batchUstCircuit.json -p build/batchUstPk.bin -v build/batchUstVk.json -s build/BatchUpdateStateTreeVerifier.sol -vs BatchUpdateStateTreeVerifier

echo 'Copying BatchUpdateStateTreeVerifier.sol to contracts/sol.'
cp ./build/BatchUpdateStateTreeVerifier.sol ../contracts/sol/
