#!/bin/bash

# TODO: convert this to a generic script that takes in parameters:
# --circuit The circuit file
# --circuit-circoom-out The circuit file
# --proving-key-json-out The file to which to write the proving key in JSON format created by `snarkjs setup`
# --proving-key-bin-out The file to which to write the proving key as created by websnark/tools/buildpkey.js
# --verifier-sol-out The file to which to write the Solidity verifier contract

cd "$(dirname "$0")"
mkdir -p ../build
cd ../build

if [ -f ./stateTreeUpdaterCircuit.json ]; then
    echo "./stateTreeUpdaterCircuit.json already exists. Skipping."
else
    echo 'Generating stateTreeUpdaterCircuit.json'
    export NODE_OPTIONS=--max-old-space-size=4096
    npx circom ../circom/stateTreeUpdater.circom -o ./stateTreeUpdaterCircuit.json
fi

if [ -f ./stateTreeUpdateProvingKey.json ]; then
    echo "stateTreeUpdateProvingKey.json already exists. Skipping."
else
    echo 'Generating stateTreeUpdateProvingKey.json and stateTreeUpdateVerificationKey.json'
    export NODE_OPTIONS=--max-old-space-size=4096
    npx snarkjs setup --protocol groth --pk ./stateTreeUpdateProvingKey.json --vk ./stateTreeUpdateVerificationKey.json
fi

if [ -f ./stateTreeUpdateProvingKey.bin ]; then
    echo 'stateTreeUpdateProvingKey.bin already exists. Skipping.'
else
    echo 'Generating proving_key.bin'
    export NODE_OPTIONS=--max-old-space-size=4096
    node ../node_modules/websnark/tools/buildpkey.js -i ./stateTreeUpdateProvingKey.json -o ./stateTreeUpdateProvingKey.bin
fi

if [ -f ./stateTreeUpdaterProofVerifier.sol ]; then
    echo 'stateTreeUpdaterProofVerifier.sol already exists. Skipping.'
else
    echo 'Generating stateTreeUpdaterProofVerifier.sol'
    npx snarkjs generateverifier --vk ./stateTreeUpdateVerificationKey.json -v ./stateTreeUpdaterProofVerifier.sol
fi

# Copy stateTreeUpdaterProofVerifier.sol to the contracts/sol directory
echo 'Copying stateTreeUpdaterProofVerifier.sol to contracts/sol.'
cp ./stateTreeUpdaterProofVerifier.sol ../../contracts/sol/
