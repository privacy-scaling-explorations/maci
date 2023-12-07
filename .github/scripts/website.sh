#!/bin/bash

set -e

# install and build project
npm install && npm run bootstrap && npm run build

# run typedoc
npm run typedoc

# run solidity docgen
cd contracts && npm run docs && cd ../

# fix typedoc links and add solidity natspec index toc 
cd website && npm install && npm run build