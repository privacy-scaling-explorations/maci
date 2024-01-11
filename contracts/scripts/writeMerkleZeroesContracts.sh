#!/bin/bash
set -e

cd "$(dirname "$0")"
cd ..

# The nothing-up-my-sleeve value
maciNums="8370432830353022751713833565135785980866757267633941821328460903436894336785"

# The hash of a blank state leaf
blankSl="6769006970205099520508948723718471724660867171122235270773600567925038008762"

# Binary tree with zero = 0
pnpm exec ts-node ts/genZerosContract.ts \
    MerkleBinary0 0 2 33 "Binary tree zeros (0)" 0 0 \
    > contracts/trees/zeros/MerkleBinary0.sol

# Binary tree with zero = maciNums
pnpm exec ts-node ts/genZerosContract.ts \
    MerkleBinaryMaci $maciNums 2 33 "Binary tree zeros (Keccak hash of 'Maci')" 0 0 \
    > contracts/trees/zeros/MerkleBinaryMaci.sol

# Quinary tree with zero = 0
pnpm exec ts-node ts/genZerosContract.ts \
    MerkleQuinary0 0 5 33 "Quinary tree zeros (0)" 0 0 \
    > contracts/trees/zeros/MerkleQuinary0.sol

# Quinary tree with zero = maciNums
pnpm exec ts-node ts/genZerosContract.ts \
    MerkleQuinaryMaci $maciNums 5 33 "Quinary tree zeros (Keccak hash of 'Maci')" 0 0 \
    > contracts/trees/zeros/MerkleQuinaryMaci.sol

# Quinary tree with zero = blank state leaf
pnpm exec ts-node ts/genZerosContract.ts \
    MerkleQuinaryBlankSl $blankSl 5 33 "Quinary tree zeros (hash of a blank state leaf)" 0 0 \
    > contracts/trees/zeros/MerkleQuinaryBlankSl.sol

## Quinary tree with SHA256 for subtrees and zero = maciNums
#pnpm exec ts-node ts/genZerosContract.ts \
    #MerkleQuinaryMaciWithSha256 $maciNums 5 33 "Quinary tree (with SHA256) zeros (Keccak hash of 'Maci')" 1 2 \
    #> contracts/trees/zeros/MerkleQuinaryMaciWithSha256.sol
