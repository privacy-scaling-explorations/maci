#!/bin/bash

# Assuming this script file is located under circuits/circom/scripts and
CWD=$(pwd)
OUTPUT_PATH="../build/test/"
CIRCUITS_PATH="./circom/test"
mkdir -p "$OUTPUT_PATH"

for circuit in "$CIRCUITS_PATH"/*.circom
do  
    # Compile circuit
    echo "#### Compile Circuit: "$circuit""
    circom --O2 --wasm --r1cs --sym --output "$OUTPUT_PATH" -l ./node_modules/circomlib/circuits -l ./node_modules/@zk-kit/circuits/circom "$circuit"

    cd "$CWD"
done
