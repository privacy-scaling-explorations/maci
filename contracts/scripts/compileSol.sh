#!/bin/bash
set -o pipefail

cd "$(dirname "$0")"
cd ..

# Delete old files
rm -rf ./compiled/*

echo 'Downloading solc...'
case "$OSTYPE" in
  darwin*)  solcPlatform="solc-macos" ;;
  linux*)   solcPlatform="solc-static-linux" ;;
  *)        solcPlatform="solc-static-linux" ;;
esac
solcBin=$(pwd)/solc
wget -nc -q -O $solcBin https://github.com/ethereum/solidity/releases/download/v0.7.6/${solcPlatform}

chmod a+x $solcBin

paths="$(pwd)/sol/,$(pwd)/node_modules/@openzeppelin/"
oz_map="@openzeppelin/=$(pwd)/node_modules/@openzeppelin/"

echo 'Writing Merkle zeros contracts'
./scripts/writeMerkleZeroesContracts.sh

echo 'Writing empty ballot tree root contract'
./scripts/writeEmptyBallotRoots.sh

echo 'Building contracts'
$solcBin $oz_map -o ./compiled \
    ./sol/*.sol \
    ./sol/**/*.sol \
    ./sol/**/**/*.sol \
    --overwrite --optimize --bin --abi --allow-paths=$paths

# Build the Poseidon contract from bytecode
node build/buildPoseidon.js
