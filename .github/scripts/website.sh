#!/bin/bash

set -e

# install maci dependencies, bootstrap monorepo and build packages
npm install && npm run bootstrap && npm run build

# run typedoc
npm run typedoc

# run solidity docgen
cd contracts && npm run docs 

# fix links in the website and build again
cd ../website && npm run build 
