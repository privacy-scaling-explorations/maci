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
    circom --O0 --r1cs --c --sym --output "$OUTPUT_PATH" "$circuit"

    # Generate executable that can compute the witness of this circuit
    filename=$(basename "$circuit" .circom)
    cd ""$OUTPUT_PATH""$filename"_cpp"
    make

    cd "$CWD"
done