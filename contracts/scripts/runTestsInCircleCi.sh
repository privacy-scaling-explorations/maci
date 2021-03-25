#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

npm run hardhat &
sleep 3 &&
NODE_OPTIONS=--max-old-space-size=4096
#npx jest --force-exit batchProcessMessageAndQuadVoteTally.test.ts &&
#npx jest --force-exit MACI.test.ts &&
npx jest --force-exit DomainObjs.test.ts &&
npx jest --force-exit Hasher.test.ts &&
npx jest --force-exit AccQueue.test.ts
