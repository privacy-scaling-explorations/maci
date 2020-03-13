#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

npm run ganache &
sleep 3 &&
NODE_OPTIONS=--max-old-space-size=4096 npx jest --force-exit Maci.test.ts &&
npx jest --force-exit Hasher.test.ts &&
npx jest --force-exit IncrementalMerkleTree.test.ts
