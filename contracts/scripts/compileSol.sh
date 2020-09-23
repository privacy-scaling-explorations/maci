#!/bin/bash
set -e

cd "$(dirname "$0")"
cd ..
echo 'Building contracts'

# Delete old files
rm -rf ./compiled/*

if [[ -z "${SOLC_PATH}" ]]; then
    # Assumes that you have solc 0.5.17 (https://github.com/ethereum/solidity/releases/tag/v0.5.17) installed in your PATH
    solcBin="solc"
else
    # Otherwise, you can specify the path to solc 0.5.17
    solcBin="${SOLC_PATH}"
fi

paths="$(pwd)/sol/"

$solcBin -o ./compiled ./sol/*.sol --overwrite --optimize --bin --abi --bin-runtime --allow-paths=$paths
$solcBin -o ./compiled ./sol/**/*.sol --overwrite --optimize --bin --abi --bin-runtime --allow-paths=$paths

# Build the Poseidon contract from bytecode
node build/buildPoseidon.js
