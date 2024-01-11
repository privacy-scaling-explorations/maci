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
pnpm exec ts-node ts/genEmptyBallotRootsContract.ts

echo 'Building contracts with Hardhat'
pnpm exec hardhat compile

echo 'Building Poseidon libraries from bytecode' 
pnpm exec ts-node ts/buildPoseidon.ts
