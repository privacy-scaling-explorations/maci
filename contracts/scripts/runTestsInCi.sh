#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

npm run hardhat &
sleep 3 &&
npm run test