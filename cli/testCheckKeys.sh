# test if keys are set correctly given a set of files

node build/index.js deployVkRegistry && \
node build/index.js setVerifyingKeys -s 10 -i 1 -m 2 -v 2 -b 1 \
    -p ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    -t ./zkeys/TallyVotes_10-1-2_test.0.zkey \
    -k 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0
node build/index.js create \
    -r 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0 && \
node ./build/index.js checkVerifyingKey \
    -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -s 10 -i 1 -m 2 -v 2 -b 1 \
    -p ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    -t ./zkeys/TallyVotes_10-1-2_test.0.zkey \


