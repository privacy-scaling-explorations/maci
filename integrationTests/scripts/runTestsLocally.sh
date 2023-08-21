#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

sleep 5
npm run test-cli-genMaciKeypair
npm run test-cli-genMaciPubkey
npm run test-suites
