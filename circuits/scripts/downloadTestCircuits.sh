#!/bin/bash
set -o pipefail

cd "$(dirname "$0")"
cd ..
mkdir -p build/test/
cd build/test

wget --quiet -O circuits.tar.gz \
    https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.2/maci_keys_10-2-1-2_dev.tar.gz
tar xf circuits.tar.gz
rm circuits.tar.gz
