#!/bin/bash

cd "$(dirname "$0")"
cd ..
mkdir -p build

node build/downloadSnarks.js

echo 'Copying BatchUpdateStateTreeVerifier.sol to contracts/sol.'
cp ./build/BatchUpdateStateTreeVerifier.sol ../contracts/sol/

echo 'Copying QuadVoteTallyVerifier.sol to contracts/sol.'
cp ./build/QuadVoteTallyVerifier.sol ../contracts/sol/
