#!/bin/bash
set -e

cd "$(dirname "$0")"
cd ..

npx ts-node ts/genEmptyBallotRootsContract.ts > contracts/trees/EmptyBallotRoots.sol
