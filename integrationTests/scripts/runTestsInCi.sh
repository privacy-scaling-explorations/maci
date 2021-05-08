#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

mkdir -p ../cli/zkeys

wget --quiet -O ../cli/zkeys/ProcessMessages_10-2-1-2.test.0.zkey \
    https://macitestcircuits.blob.core.windows.net/test/ProcessMessages_10-2-1-2.test.0.zkey

wget --quiet -O ../cli/zkeys/ProcessMessages_10-2-1-2.test \
    https://macitestcircuits.blob.core.windows.net/test/ProcessMessages_10-2-1-2.test

wget --quiet -O ../cli/zkeys/ProcessMessages_10-2-1-2.test.dat \
    https://macitestcircuits.blob.core.windows.net/test/ProcessMessages_10-2-1-2.test.dat

wget --quiet -O ../cli/zkeys/TallyVotes_10-1-2.test.0.zkey \
    https://macitestcircuits.blob.core.windows.net/test/TallyVotes_10-1-2.test.0.zkey

wget --quiet -O ../cli/zkeys/TallyVotes_10-1-2.test \
    https://macitestcircuits.blob.core.windows.net/test/TallyVotes_10-1-2.test

wget --quiet -O ../cli/zkeys/TallyVotes_10-1-2.test.dat \
    https://macitestcircuits.blob.core.windows.net/test/TallyVotes_10-1-2.test.dat

chmod a+x ../cli/zkeys/ProcessMessages_10-2-1-2.test
chmod a+x ../cli/zkeys/TallyVotes_10-1-2.test

cd ../contracts && npm run hardhat &
sleep 5
npm run test-cli-genMaciKeypair
npm run test-cli-genMaciPubkey
npm run test-suites
