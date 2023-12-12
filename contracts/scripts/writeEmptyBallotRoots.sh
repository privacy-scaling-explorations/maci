#!/bin/bash
set -e

cd "$(dirname "$0")"
cd ..

# take the stateTreeDepth as cli arg
npx ts-node ts/genEmptyBallotRootsContract.ts $1 > contracts/trees/EmptyBallotRoots.sol
