#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

NODE_OPTIONS=--max-old-space-size=4096 npm run test-minor
NODE_OPTIONS=--max-old-space-size=4096 npm run test-quadVoteTally
NODE_OPTIONS=--max-old-space-size=4096 npm run test-updateStateTree
NODE_OPTIONS=--max-old-space-size=4096 npm run test-batchUpdateStateTree
