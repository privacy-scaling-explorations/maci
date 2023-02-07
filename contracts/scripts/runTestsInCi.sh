#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

npm run hardhat &
sleep 3 &&
npx jest --runInBand --force-exit MACI.test.ts DomainObjs.test.ts Hasher.test.ts AccQueue.test.ts
