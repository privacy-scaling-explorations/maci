#!/bin/bash
set -e

cd "$(dirname "$0")"
cd ..

node build/genEmptyBallotRootsContract.js > sol/trees/EmptyBallotRoots.sol
