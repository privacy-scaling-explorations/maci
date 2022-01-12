#!/bin/bash

durationInSecs=90
cordsk=macisk.27281729e0ece51695bd064eeb4215da20498e19bd4eeab75f83b99ed80226b5
cordpk=macipk.d49f1ed2fd22ca7e3bf96a5d3bcf245e6b440fc77cfa360ae50ff7b67990fb1e
sk1=macisk.14db4cdf1fb42bee444c83aed43c40db6b1a2c79fa1067332b09b5dff0df19c5
pk1=macipk.d30bf8402e7d731e86ccc6d24726446bba3ee18e8df013ebb0c96a5b14914da9

sk2=macisk.2044549fd073daf95bfed48ab0583a6cc5cea0f45e11885a2670e712409d739
pk2=macipk.7d7cc9967a05d54d723253be7e43de570e56eda8bc86cc299f7bdb410d92e41c
sk3=macisk.18843ce600faa1656c6d1fed25b08b2c39a9aa3081d3b12eccc162e59d576ba4
pk3=macipk.29ba2f405ed1636997e6bff15463d05a2021ca5a1711952cbb03e42cdd8f7f13
sk4=macisk.1caf1c938ccd81b7aa94da3279b2f2d7965c5095bd237a0f6ef0e54efa47b561
pk4=macipk.2f4bd0898d9ea4df8c902ff2e3aeb9750b8a2bc89f35171051cfd3ba668fbc0c
sk5=macisk.1be69bd4979ad867bca3b0f44507f972f0c4699b65b0bd2de09325965648685e
pk5=macipk.bd4c03ecd1b9799ca7ab6ec6309568d9f743c4128d5d7f43d8a17f8af0dae31d
sk6=macisk.209aee1fb40e7be06ca793d964166809baf5e51c8d6e11f9be21ba00b3030918
pk6=macipk.49ee4bfba86c36cb43e60772825b55a2209b52ff202d8caf091b6921e193a290
sk7=macisk.1bdea32b18062d6647346de9caa1c8e1b18de81fc144b1b556f51bc6a3c34d5f
pk7=macipk.d354c22572a0b53ced8561f9ab16abe0b8f7f98c2133757e93cdefd45fe1b192

# Step 1
node build/index.js deployVkRegistry && \
node build/index.js setVerifyingKeys -s 10 -i 1 -m 2 -v 2 -b 1 \
    -p ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey \
    -t ./zkeys/TallyVotes_10-1-2.test.0.zkey  && \
node build/index.js create  
node ./build/index.js deployPoll \
    -pk $cordpk \
    -t $durationInSecs -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2 


node ./build/index.js signup \
    -p $pk1  && \
node ./build/index.js signup \
    -p $pk2  && \
node ./build/index.js signup \
    -p $pk3  && \
node ./build/index.js signup \
    -p $pk4  && \
node ./build/index.js signup \
    -p $pk5  && \
node ./build/index.js signup \
    -p $pk6  && \
node ./build/index.js signup \
    -p $pk7  

node build/index.js publish \
    -p $pk1 \
    -sk $sk1 \
    -i 1 -v 0 -w 9 -n 1 -o 0

node build/index.js timeTravel -s $durationInSecs 
#sleep $(($durationInSecs + 30))

# Step 2: 
# TODO: store the txn of deployVkRegistry to automate
# txn is the transaction hash of deployVkRegistry
node build/index.js mergeMessages -o 0 && \
node build/index.js mergeSignups -o 0 && \
rm -f tally.json proofs.json && \
txn=0xe6542aa85c147fc17fb2094316116190d4a0ae7ee0d42f0bc177bea9f0599d9b
node build/index.js genProofs \
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
   -t tally.json 


## Must merge first poll before create other polls

node ./build/index.js deployPoll \
    -pk $cordpk \
    -t $durationInSecs -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2  
node ./build/index.js deployPoll \
    -pk $cordpk \
    -t $durationInSecs -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2  

node build/index.js publish \
    -p $pk1 \
    -sk $sk1 \
    -i 1 -v 1 -w 9 -n 1 -o 1
node build/index.js publish \
    -p $pk2 \
    -sk $sk2 \
    -i 2 -v 2 -w 2 -n 1 -o 1
node build/index.js publish \
    -p $pk3 \
    -sk $sk3 \
    -i 3 -v 3 -w 3 -n 1 -o 1

node build/index.js publish \
    -p $pk1 \
    -sk $sk1 \
    -i 1 -v 1 -w 9 -n 1 -o 2
node build/index.js publish \
    -p $pk2 \
    -sk $sk2 \
    -i 2 -v 2 -w 2 -n 1 -o 2
node build/index.js publish \
    -p $pk5 \
    -sk $sk5 \
    -i 5 -v 5 -w 5 -n 1 -o 2

node build/index.js timeTravel -s $durationInSecs 
node build/index.js mergeMessages -o 2 && \
node build/index.js mergeSignups -o 2 && \
rm -f tally.json proofs.json && \
txn=0xe6542aa85c147fc17fb2094316116190d4a0ae7ee0d42f0bc177bea9f0599d9b
node build/index.js genProofs \
    -sk $cordsk \
    -o 2 \
    -r ~/rapidsnark/build/prover \
    -wp ./zkeys/ProcessMessages_10-2-1-2.test \
    -wt ./zkeys/TallyVotes_10-1-2.test \
    -zp ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey \
    -zt ./zkeys/TallyVotes_10-1-2.test.0.zkey \
    -t tally.json \
    -f proofs.json

node build/index.js proveOnChain \
    -o 2 \
    -f proofs.json
node build/index.js verify \
   -o 2 \
   -t tally.json 




node build/index.js mergeMessages -o 1 && \
node build/index.js mergeSignups -o 1 && \
rm -f tally.json proofs.json && \
txn=0xe6542aa85c147fc17fb2094316116190d4a0ae7ee0d42f0bc177bea9f0599d9b
node build/index.js genProofs \
    -sk $cordsk \
    -o 1 \
    -r ~/rapidsnark/build/prover \
    -wp ./zkeys/ProcessMessages_10-2-1-2.test \
    -wt ./zkeys/TallyVotes_10-1-2.test \
    -zp ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey \
    -zt ./zkeys/TallyVotes_10-1-2.test.0.zkey \
    -t tally.json \
    -f proofs.json

node build/index.js proveOnChain \
    -o 1 \
    -f proofs.json
node build/index.js verify \
   -o 1 \
   -t tally.json 


