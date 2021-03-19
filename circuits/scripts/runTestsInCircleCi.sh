#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

npm run circom-helper &
sleep 800 &&
NODE_OPTIONS=--max-old-space-size=4096 npm run test-minor
NODE_OPTIONS=--max-old-space-size=4096 npm run test-mt
NODE_OPTIONS=--max-old-space-size=4096 npm run test-quin-mt
