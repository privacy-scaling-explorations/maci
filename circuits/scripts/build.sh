#!/bin/bash

BASE_DIR="$( cd "$( dirname "$0" )" && pwd )"

# Assuming this script file is located under circuits/circom/scripts and
# circomHelperConfig.json is located under circuits/
CIRCOM_PATH="$BASE_DIR"/../$(grep -o '"circom": "[^"]*' "$BASE_DIR"/../circomHelperConfig.json | cut -d'"' -f4)
CIRCUITS_PATH=$(awk -F'"' '/"circuitDirs": \[/{getline; print $2}' "$BASE_DIR"/../circomHelperConfig.json)

OUTPUT_PATH=""$BASE_DIR"/../build/test/"


mkdir -p "$OUTPUT_PATH"

for circuit in "$CIRCUITS_PATH"/*.circom
do  
    # Change directory into `circuits/`
    cd "$BASE_DIR"/..

    # Compile circuit
    echo "#### Compile Circuit: "$circuit""
    "$CIRCOM_PATH" --O0 --r1cs --c --sym --output "$OUTPUT_PATH" "$circuit"

    # Generate executable that could compute the witness of given circuit
    filename=$(basename "$circuit" .circom)
    cd ""$OUTPUT_PATH""$filename"_cpp"
    make

    # Move generated files under $OUTPUT_PATH to allow circom-helper to recognize them
    mv ""$OUTPUT_PATH""$filename"_cpp/"$filename"" ""$OUTPUT_PATH""$filename""
    mv ""$OUTPUT_PATH""$filename"_cpp/"$filename".dat" ""$OUTPUT_PATH""$filename".dat"

    chmod +x ""$OUTPUT_PATH""$filename""
done