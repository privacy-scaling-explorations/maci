#!/bin/bash
set -e

cd "$(dirname "$0")"
cd ..

# The nothing-up-my-sleeve value
maciNums="8370432830353022751713833565135785980866757267633941821328460903436894336785"

# Binary tree with zero = 0
node build/genZerosContract.js \
    MerkleBinary0 0 2 33 "Binary tree zeros (0)" \
    > sol/trees/zeros/MerkleBinary0.sol

# Binary tree with zero = maciNums
node build/genZerosContract.js \
    MerkleBinaryMaci $maciNums 2 33 "Binary tree zeros (Keccack hash of 'Maci')" \
    > sol/trees/zeros/MerkleBinaryMaci.sol

# Quinary tree with zero = 0
node build/genZerosContract.js \
    MerkleQuinary0 0 5 33 "Quinary tree zeros (0)" \
    > sol/trees/zeros/MerkleQuinary0.sol

# Quinary tree with zero = maciNums
node build/genZerosContract.js \
    MerkleQuinaryMaci $maciNums 5 33 "Quinary tree zeros (Keccack hash of 'Maci')" \
    > sol/trees/zeros/MerkleQuinaryMaci.sol
