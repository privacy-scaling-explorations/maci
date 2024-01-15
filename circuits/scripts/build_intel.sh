#!/bin/bash

# Assuming this script file is located under circuits/circom/scripts and
CWD=$(pwd)
OUTPUT_PATH="./build/test/"
CIRCUITS_PATH="./circom/test"
mkdir -p "$OUTPUT_PATH"

for circuit in "$CIRCUITS_PATH"/*.circom
do  
    # Compile circuit with circom directly as we need the c witness file
    echo "#### Compile Circuit: "$circuit""
    circom --O2 --wasm --r1cs --c --sym --output "$OUTPUT_PATH" -l ./node_modules/circomlib/circuits -l ./node_modules/@zk-kit/circuits/circom "$circuit"
    # Generate executable that can compute the witness of this circuit
    filename=$(basename "$circuit" .circom)
    cd ""$OUTPUT_PATH""$filename"_cpp"
    make

    # Move the witness files out of their folders
    mv "$filename" "../"
    mv "$filename.dat" "../"

    cd "$CWD"
done
