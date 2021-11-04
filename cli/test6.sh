# 8 signups, 10 messages
node build/index.js deployVkRegistry

node build/index.js setVerifyingKeys -s 10 -i 1 -m 2 -v 2 -b 1 -p ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey -t ./zkeys/TallyVotes_10-1-2_test.0.zkey -k 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0

node build/index.js create -r 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0

node build/index.js deployPoll -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -pk macipk.81722e96a9296698f90cbd895786a0088d3ab5c36b0176f2c65b5415de7b5b2f -t 60 -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2

node ./build/index.js signup -p macipk.014cc8ef5a0022da608efab55e891417be0a474ba70b912dc6c2e6acea1a1499 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a

node ./build/index.js signup -p macipk.0b1ec710ee4cac976b027e2fdabd2647c6dc6389ca4168db09ce79b3688ab598 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a

node ./build/index.js signup -p macipk.adfdafaa47e79c71995b4d9a6783e610098a28a79d96804034a1c7174a9b748c -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a

node ./build/index.js signup -p macipk.bfd90ae77a492e527c7ba5e451cc03bc7706982b11c2e0ae35e380fb541b0e95 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a

node ./build/index.js signup -p macipk.f7dc5da79e53d8e634f58506be11bc593f4d731834cbffc0fadff319215f8aad -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a

node build/index.js publish -sk macisk.2d257e1ce4acac2dcd5d25b3802a0e64c7c27a6e8f76ba48f41c90a2c1f8bf2a -p macipk.014cc8ef5a0022da608efab55e891417be0a474ba70b912dc6c2e6acea1a1499 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 1 -v 0 -w 1 -n 1 -o 0

node build/index.js publish -sk macisk.179b7213d423381d25f9ef8ba3040c9e1e8b785600ab3484d042c13bfe3e7b7b -p macipk.0b1ec710ee4cac976b027e2fdabd2647c6dc6389ca4168db09ce79b3688ab598 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 2 -v 0 -w 1 -n 1 -o 0

node build/index.js publish -sk macisk.ce8ca954499a2e6ef89ba1f29b457f8cdfe7e2fd1f8b7baa33ecc7b1bb797f8 -p macipk.adfdafaa47e79c71995b4d9a6783e610098a28a79d96804034a1c7174a9b748c -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 3 -v 0 -w 1 -n 1 -o 0

node build/index.js publish -sk macisk.28c1c7bb2b081da17e82075264ec20d6a022fbd54e0a0568b94fcaaef45fe261 -p macipk.bfd90ae77a492e527c7ba5e451cc03bc7706982b11c2e0ae35e380fb541b0e95 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 4 -v 0 -w 1 -n 1 -o 0

node build/index.js publish -sk macisk.1ee8e41c2b79b1a79659ccde72ed0e24b1ad97c7c550aaf8261defb46eb78343 -p macipk.f7dc5da79e53d8e634f58506be11bc593f4d731834cbffc0fadff319215f8aad -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 5 -v 0 -w 1 -n 1 -o 0

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
