# 8 signups, 10 messages
node build/index.js deployVkRegistry

node build/index.js setVerifyingKeys -s 10 -i 1 -m 2 -v 2 -b 1 -p ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey -t ./zkeys/TallyVotes_10-1-2_test.0.zkey -k 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0

node build/index.js create -r 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0

node build/index.js deployPoll -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -pk macipk.81722e96a9296698f90cbd895786a0088d3ab5c36b0176f2c65b5415de7b5b2f -t 60 -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2

node ./build/index.js signup -p macipk.4d8797043f3f54b9090cb7ddbb79a618297e3f94011e2d2b206dc05a52722498 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a

node ./build/index.js signup -p macipk.e774ca3c13d4a4b4599c13ed7fb8f82b21181d7787c7a29e76d63283b229e123 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a

node ./build/index.js signup -p macipk.1b3bb4ea01efad61877d04d8aa5fb2d3f509f75173be1411630cd7c47c02ea27 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a

node ./build/index.js signup -p macipk.3a88d434c5c5a3ca15b849c8542087026f7890f73451429d57e75f4a3c9e7581 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a

node ./build/index.js publish -sk macisk.295f450eacd883207b0eee91a95439bd45e3332b3f7ac13a1847fbed84f16bd1 -p macipk.4d8797043f3f54b9090cb7ddbb79a618297e3f94011e2d2b206dc05a52722498 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 1 -v 0 -w 1 -n 1 -o 0

node ./build/index.js publish -sk macisk.1d30cdd3bb93910580e0c0718c45ec65b7ab2fa2e87c5ba6800612ab00c2175e -p macipk.e774ca3c13d4a4b4599c13ed7fb8f82b21181d7787c7a29e76d63283b229e123 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 2 -v 0 -w 1 -n 1 -o 0

node ./build/index.js publish -sk macisk.10da10e0e9a5cc1a7a9505868940ca7d493eef6589b860e8de287a7f5d65dce1 -p macipk.1b3bb4ea01efad61877d04d8aa5fb2d3f509f75173be1411630cd7c47c02ea27 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 3 -v 0 -w 1 -n 1 -o 0

node ./build/index.js publish -sk macisk.58dbcf4ee007b14856192fb336bba171fcb5a630f4954d49e49ac1d95af360e -p macipk.3a88d434c5c5a3ca15b849c8542087026f7890f73451429d57e75f4a3c9e7581 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 4 -v 0 -w 1 -n 1 -o 0

node build/index.js timeTravel -s 60

node build/index.js mergeSignups -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -o 0
node build/index.js mergeMessages -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -o 0

rm -rf proofs tally.json

node build/index.js genProofs -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -sk macisk.1b421413d3e82a3e955b591b2d8f943032537e7a8634223710c6c0f0094a058b -o 0 -r ~/rapidsnark/build/prover -wp ./zkeys/ProcessMessages_10-2-1-2.test -wt ./zkeys/TallyVotes_10-1-2.test -zp ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey -zt ./zkeys/TallyVotes_10-1-2.test.0.zkey -t tally.json -f proofs/

node build/index.js proveOnChain \
    -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -o 0 \
    -q 0xEcFcaB0A285d3380E488A39B4BB21e777f8A4EaC \
    -f proofs/

node build/index.js verify \
    -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -o 0 \
    -t tally.json \
    -q 0xEcFcaB0A285d3380E488A39B4BB21e777f8A4EaC
