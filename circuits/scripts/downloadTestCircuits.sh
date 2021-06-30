#!/bin/bash
set -o pipefail

cd "$(dirname "$0")"
cd ..
mkdir -p build/test/
cd build/test

wget --quiet -O circuits.tar.gz \
    https://macitestcircuits.blob.core.windows.net/test/big_test_circuits.tar.gz
tar xf circuits.tar.gz
rm circuits.tar.gz
