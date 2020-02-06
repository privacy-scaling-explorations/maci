#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

npm run ganache &
sleep 3 &&
npx jest --force-exit Maci.test.ts &&
npx jest --force-exit Hasher.test.ts
