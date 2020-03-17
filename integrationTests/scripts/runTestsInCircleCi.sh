#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

cd ../contracts && npm run ganache &
sleep 3 &&
#NODE_OPTIONS=--max-old-space-size=4096 npx jest --force-exit Maci.test.ts &&
#npx jest --force-exit Hasher.test.ts &&
npm run test-signup &&
npm run test-publishMessage
