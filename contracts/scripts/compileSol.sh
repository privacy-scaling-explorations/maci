#!/bin/bash
set -o pipefail

cd "$(dirname "$0")"
cd ..

# Delete old files
rm -rf ./artifacts/*
rm -rf ./cache/*

echo 'Generate typechain-types'
npx hardhat compile

echo 'Writing Merkle zeros contracts'
./scripts/writeMerkleZeroesContracts.sh 

echo 'Writing empty ballot tree root contract'
./scripts/writeEmptyBallotRoots.sh $1

echo 'Building contracts with Hardhat'
npx hardhat compile

# Build the Poseidon contract from bytecode
npx ts-node ts/buildPoseidon.ts
