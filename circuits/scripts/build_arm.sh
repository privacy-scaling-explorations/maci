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
    circom --O0 --wasm --r1cs --sym --output "$OUTPUT_PATH" "$circuit"

    cd "$CWD"
done
