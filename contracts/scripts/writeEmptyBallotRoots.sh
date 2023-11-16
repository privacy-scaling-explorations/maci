#!/bin/bash
set -e

cd "$(dirname "$0")"
cd ..

# take the stateTreeDepth as cli arg
node build/genEmptyBallotRootsContract.js $1 > contracts/trees/EmptyBallotRoots.sol
