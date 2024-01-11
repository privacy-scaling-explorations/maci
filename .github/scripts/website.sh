#!/bin/bash

set -e

# install maci dependencies, bootstrap monorepo and build packages
pnpm install && pnpm run build

# run typedoc
pnpm run typedoc

# run solidity docgen
cd contracts && pnpm run docs 

# fix links in the website and build again
cd ../website && pnpm run build 
