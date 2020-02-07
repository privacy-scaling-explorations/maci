#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

npm run test-minor
npm run test-major
