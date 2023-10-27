#!/bin/bash

# Assuming this script file is located under circuits/circom/scripts and
OUTPUT_PATH="../build/test/"
CIRCUITS_PATH="./circom/test"
mkdir -p "$OUTPUT_PATH"

for circuit in "$CIRCUITS_PATH"/*.circom
do  
    # Compile circuit
    echo "#### Compile Circuit: "$circuit""
    circom --O0 --r1cs --c --sym --output "$OUTPUT_PATH" "$circuit"

    # Generate executable that could compute the witness of given circuit
    filename=$(basename "$circuit" .circom)
    cd ""$OUTPUT_PATH""$filename"_cpp"
    make

    cd ../

    # Move generated files under $OUTPUT_PATH to allow circom-helper to recognize them
    mv ""$OUTPUT_PATH""$filename"_cpp/"$filename"" ""$OUTPUT_PATH""$filename""
    mv ""$OUTPUT_PATH""$filename"_cpp/"$filename".dat" ""$OUTPUT_PATH""$filename".dat"

    chmod +x ""$OUTPUT_PATH""$filename""
done