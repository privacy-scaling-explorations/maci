#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

mkdir -p ../cli/zkeys

wget --quiet -O ../cli/zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    https://macitestcircuits.blob.core.windows.net/circom2/ProcessMessages_10-2-1-2_test.0.zkey

wget --quiet -O ../cli/zkeys/ProcessMessages_10-2-1-2_test \
    https://macitestcircuits.blob.core.windows.net/circom2/ProcessMessages_10-2-1-2_test

wget --quiet -O ../cli/zkeys/ProcessMessages_10-2-1-2_test.dat \
    https://macitestcircuits.blob.core.windows.net/circom2/ProcessMessages_10-2-1-2_test.dat

wget --quiet -O ../cli/zkeys/TallyVotes_10-1-2_test.0.zkey \
    https://macitestcircuits.blob.core.windows.net/circom2/TallyVotes_10-1-2_test.0.zkey

wget --quiet -O ../cli/zkeys/TallyVotes_10-1-2_test \
    https://macitestcircuits.blob.core.windows.net/circom2/TallyVotes_10-1-2_test

wget --quiet -O ../cli/zkeys/TallyVotes_10-1-2_test.dat \
    https://macitestcircuits.blob.core.windows.net/circom2/TallyVotes_10-1-2_test.dat

chmod a+x ../cli/zkeys/ProcessMessages_10-2-1-2_test
chmod a+x ../cli/zkeys/TallyVotes_10-1-2_test

cd ../contracts && npm run hardhat &
sleep 5
npm run test-cli-genMaciKeypair
npm run test-cli-genMaciPubkey
npm run test-suites
