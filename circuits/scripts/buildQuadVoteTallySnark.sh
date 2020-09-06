#!/bin/bash

set -e

cd "$(dirname "$0")"
cd ..
mkdir -p build

NODE_OPTIONS=--max-old-space-size=8192 node build/buildSnarks.js -i circom/prod/quadVoteTally.circom -j build/qvtCircuit.r1cs -w build/qvt.wasm -p build/qvtPk.bin -v build/qvtVk.json -s build/QuadVoteTallyVerifier.sol -vs QuadVoteTallyVerifier -z build/qvt.zkey

echo 'Copying QuadVoteTallyVerifier.sol to contracts/sol.'
cp ./build/QuadVoteTallyVerifier.sol ../contracts/sol/
