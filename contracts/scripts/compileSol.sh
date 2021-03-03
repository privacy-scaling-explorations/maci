#!/bin/bash
set -o pipefail

cd "$(dirname "$0")"
cd ..

# Delete old files
rm -rf ./artifacts/*
rm -rf ./cache/*

paths="$(pwd)/sol/,$(pwd)/node_modules/@openzeppelin/"
oz_map="@openzeppelin/=$(pwd)/node_modules/@openzeppelin/"

echo 'Writing Merkle zeros contracts'
./scripts/writeMerkleZeroesContracts.sh

echo 'Writing empty ballot tree root contract'
./scripts/writeEmptyBallotRoots.sh

echo 'Building contracts with Hardhat'
npx hardhat compile

# Build the Poseidon contract from bytecode
node build/buildPoseidon.js
