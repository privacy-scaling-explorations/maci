# one signup and one valid message for multiple polls

node build/index.js deployVkRegistry  && \
node build/index.js setVerifyingKeys -s 10 -i 1 -m 2 -v 2 -b 1 \
    -p ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    -t ./zkeys/TallyVotes_10-1-2_test.0.zkey  \
    -ss ./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey  

node build/index.js create 
echo "deploy poll 0 ..."
node ./build/index.js deployPoll \
    -pk macipk.c974f4f168b79727ac98bfd53a65ea0b4e45dc2552fe73df9f8b51ebb0930330 \
    -t 20 -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2 

node ./build/index.js signup \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 

node build/index.js publish \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    -sk macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    -i 1 -v 0 -w 9 -n 1 -o 0

node build/index.js timeTravel -s 30 && \
node build/index.js mergeMessages -o 0 && \
node build/index.js mergeSignups -o 0 

echo "gen proofs 0..."
rm -rf tally.json subsidy.json proofs && \
node build/index.js genProofs \
    -sk macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
    -o 0 \
    -r ~/rapidsnark/build/prover \
    -wp ./zkeys/ProcessMessages_10-2-1-2_test \
    -wt ./zkeys/TallyVotes_10-1-2_test \
    -ws ./zkeys/SubsidyPerBatch_10-1-2_test \
    -zp ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    -zt ./zkeys/TallyVotes_10-1-2_test.0.zkey \
    -zs ./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey \
    -t tally.json \
    -sf subsidy.json \
    -f proofs/

echo "proof on chain 0..."
node build/index.js proveOnChain \
    -o 0 \
    -f proofs/

node build/index.js verify \
    -o 0 \
    -t tally.json \
    -sf subsidy.json

echo "deploy poll 1..."
node ./build/index.js deployPoll \
    -pk macipk.c974f4f168b79727ac98bfd53a65ea0b4e45dc2552fe73df9f8b51ebb0930330 \
    -t 120 -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2 && \

node build/index.js publish \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    -sk macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    -i 1 -v 0 -w 7 -n 1 -o 1

node build/index.js timeTravel -s 140 && \
node build/index.js mergeMessages -o 1 && \
node build/index.js mergeSignups -o 1 

echo "gen proof 1..."
rm -rf tally.json subsidy.json proofs && \
node build/index.js genProofs \
    -sk macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
    -o 1 \
    -r ~/rapidsnark/build/prover \
    -wp ./zkeys/ProcessMessages_10-2-1-2_test \
    -wt ./zkeys/TallyVotes_10-1-2_test \
    -ws ./zkeys/SubsidyPerBatch_10-1-2_test \
    -zp ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    -zt ./zkeys/TallyVotes_10-1-2_test.0.zkey \
    -zs ./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey \
    -t tally.json \
    -sf subsidy.json \
    -f proofs/

node build/index.js proveOnChain \
    -o 1 \
    -f proofs/

node build/index.js verify \
    -o 1 \
    -t tally.json \
    -sf subsidy.json

