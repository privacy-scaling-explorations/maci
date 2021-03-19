#!/bin/bash

#!/bin/bash
set -o pipefail

cd "$(dirname "$0")"
cd ..
mkdir -p build/test/
cd build/test

wget --quiet -O processMessages_test.tar.gz https://www.dropbox.com/s/ejq4tp8ndmvl4k5/processMessages_test.tar.gz?dl=1
tar xf processMessages_test.tar.gz
rm processMessages_test.tar.gz
