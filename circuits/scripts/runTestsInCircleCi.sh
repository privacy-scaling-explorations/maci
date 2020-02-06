#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

npx jest --force-exit
