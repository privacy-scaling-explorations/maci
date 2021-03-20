#!/bin/bash

#!/bin/bash
set -o pipefail

cd "$(dirname "$0")"
cd ..
mkdir -p build/test/
cd build/test

wget --quiet -O circuits.tar.gz \
    https://www.dropbox.com/s/usbxugimo1x4f20/big_test_circuits.tar.gz?dl=1
tar xf circuits.tar.gz
rm circuits.tar.gz
