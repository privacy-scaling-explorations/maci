# one signup and one valid message

node build/index.js deployVkRegistry && \
node build/index.js setVerifyingKeys -s 10 -i 1 -m 2 -v 2 -b 1 \
    -ic 1  -cf 10 \
    -p ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    -t ./zkeys/TallyVotes_10-1-2_test.0.zkey  \
    -cz ./zkeys/CoefficientPerBatch_10-1-2_test.0.zkey 

node build/index.js create 
node ./build/index.js deployPoll \
    -pk macipk.c974f4f168b79727ac98bfd53a65ea0b4e45dc2552fe73df9f8b51ebb0930330 \
    -t 40 -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2  -ic 1 -c 10

node ./build/index.js signup \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391  
node ./build/index.js signup \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391  
node ./build/index.js signup \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391  
node ./build/index.js signup \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391  
node ./build/index.js signup \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391  
node ./build/index.js signup \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391  

node build/index.js publish \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    -sk macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    -i 6 -v 5 -w 6 -n 1 -o 0
node build/index.js publish \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    -sk macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    -i 5 -v 4 -w 5 -n 1 -o 0
node build/index.js publish \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    -sk macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    -i 4 -v 3 -w 4 -n 1 -o 0

node build/index.js publish \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    -sk macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    -i 3 -v 2 -w 3 -n 1 -o 0
node build/index.js publish \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    -sk macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    -i 2 -v 1 -w 2 -n 1 -o 0
node build/index.js publish \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    -sk macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    -i 1 -v 0 -w 1 -n 1 -o 0


node build/index.js publish \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    -sk macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    -i 5 -v 0 -w 5 -n 1 -o 0
node build/index.js publish \
    -p macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    -sk macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    -i 3 -v 0 -w 5 -n 1 -o 0


node build/index.js timeTravel -s 30 && \
node build/index.js mergeMessages -o 0 && \
node build/index.js mergeSignups -o 0 

echo "gen proofs..."
rm -rf proofs coeff.json tally.json && \
node build/index.js genProofs \
    -sk macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
    -o 0 \
    -r ~/rapidsnark/build/prover \
    -wp ./zkeys/ProcessMessages_10-2-1-2_test \
    -wt ./zkeys/TallyVotes_10-1-2_test \
    -wc ./zkeys/CoefficientPerBatch_10-1-2_test \
    -zp ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    -zt ./zkeys/TallyVotes_10-1-2_test.0.zkey \
    -zc ./zkeys/CoefficientPerBatch_10-1-2_test.0.zkey \
    -t tally.json \
    -cf coeff.json \
    -f proofs/

echo "proof on chain ..."
node build/index.js proveOnChain \
    -o 0 \
    -f proofs/

echo "verify on chain ..."
node build/index.js verify \
    -o 0 \
    -t tally.json 

