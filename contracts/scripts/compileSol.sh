#!/bin/bash
set -o pipefail

cd "$(dirname "$0")"
cd ..

# Delete old files
rm -rf ./artifacts/*
rm -rf ./cache/*

echo 'Writing Merkle zeros contracts'
./scripts/writeMerkleZeroesContracts.sh

echo 'Writing empty ballot tree root contract'
./scripts/writeEmptyBallotRoots.sh

echo 'Building contracts with Hardhat'
npx hardhat compile

# Build the Poseidon contract from bytecode
node build/buildPoseidon.js
