#!/bin/bash

durationInSecs=90
cordsk=macisk.27281729e0ece51695bd064eeb4215da20498e19bd4eeab75f83b99ed80226b5
cordpk=macipk.d49f1ed2fd22ca7e3bf96a5d3bcf245e6b440fc77cfa360ae50ff7b67990fb1e
sk1=macisk.14db4cdf1fb42bee444c83aed43c40db6b1a2c79fa1067332b09b5dff0df19c5
pk1=macipk.d30bf8402e7d731e86ccc6d24726446bba3ee18e8df013ebb0c96a5b14914da9

# Step 1
#node build/index.js deployVkRegistry && \
#node build/index.js setVerifyingKeys -s 10 -i 1 -m 2 -v 2 -b 1 \
#    -p ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey \
#    -t ./zkeys/TallyVotes_10-1-2.test.0.zkey  && \
#node build/index.js create  && \
#node ./build/index.js deployPoll \
#    -pk $cordpk \
#    -t $durationInSecs -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2 && \
#node ./build/index.js signup \
#    -p $pk1  && \
#node build/index.js publish \
#    -p $pk1 \
#    -sk $sk1 \
#    -i 1 -v 0 -w 9 -n 1 -o 0
#
#sleep $(($durationInSecs + 30))
#    
#node build/index.js mergeMessages -o 0 && \
#node build/index.js mergeSignups -o 0 && \
#rm -f tally.json proofs.json && \

# Step 2: 
# TODO: store the txn of deployVkRegistry to automate
# txn is the transaction hash of deployVkRegistry
txn=0xe6542aa85c147fc17fb2094316116190d4a0ae7ee0d42f0bc177bea9f0599d9b
node build/index.js genProofs \
    -tx $txn \
    -sk $cordsk \
    -o 0 \
    -r ~/rapidsnark/build/prover \
    -wp ./zkeys/ProcessMessages_10-2-1-2.test \
    -wt ./zkeys/TallyVotes_10-1-2.test \
    -zp ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey \
    -zt ./zkeys/TallyVotes_10-1-2.test.0.zkey \
    -t tally.json \
    -f proofs.json

node build/index.js proveOnChain \
    -o 0 \
    -f proofs.json
node build/index.js verify \
   -o 0 \
   -t tally.json \
