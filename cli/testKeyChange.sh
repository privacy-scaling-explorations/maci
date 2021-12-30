# Test key-change

node build/index.js deployVkRegistry

node build/index.js setVerifyingKeys -s 10 -i 1 -m 2 -v 2 -b 1 \
    -p ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    -t ./zkeys/TallyVotes_10-1-2_test.0.zkey \
    -k 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0
    
node build/index.js create \
    -r 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0
    
node ./build/index.js deployPoll -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -pk macipk.c974f4f168b79727ac98bfd53a65ea0b4e45dc2552fe73df9f8b51ebb0930330 \
    -t 20 -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2

node ./build/index.js signup \
    -p macipk.b8590fdba5e9cde5606dad5db384be4d253d0a2064d1e03f9600ee021a7ebe16 \
    -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a && \


# Vote for option 0
node build/index.js publish \
    -p macipk.b8590fdba5e9cde5606dad5db384be4d253d0a2064d1e03f9600ee021a7ebe16 \
    -sk macisk.2ae4f199bf3925a2407f7c775c9261f351ab861d8e9ecbb84622bdd3f6d41b08 \
    -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -i 0 -v 0 -w 9 -n 1 -o 0


# Change key:

# Private key: macisk.220b09bca39ddc56deaaecddcdf616529cd2ed3eeda2354795515f17894e1c65
# Public key:  macipk.b42b0da48010682d8c781d403f6b83db00c5e0970094ef3618393e7a3262c320

node build/index.js publish \
    -p macipk.b42b0da48010682d8c781d403f6b83db00c5e0970094ef3618393e7a3262c320 \
    -sk macisk.2ae4f199bf3925a2407f7c775c9261f351ab861d8e9ecbb84622bdd3f6d41b08 \
    -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -i 0 -v 0 -w 0 -n 1 -o 0

# Vote for option 1 with new key

node build/index.js publish \
    -p macipk.b42b0da48010682d8c781d403f6b83db00c5e0970094ef3618393e7a3262c320 \
    -sk macisk.220b09bca39ddc56deaaecddcdf616529cd2ed3eeda2354795515f17894e1c65 \
    -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -i 0 -v 1 -w 9 -n 2 -o 0

node build/index.js timeTravel -s 30 && \
node build/index.js mergeMessages -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -o 0 && \
node build/index.js mergeSignups -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -o 0 && \
rm -rf tally.json proofs/ && \
node build/index.js genProofs -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -sk macisk.1b421413d3e82a3e955b591b2d8f943032537e7a8634223710c6c0f0094a058b \
    -o 0 \
    -r ~/rapidsnark/build/prover \
    -wp ./zkeys/ProcessMessages_10-2-1-2_test \
    -wt ./zkeys/TallyVotes_10-1-2_test \
    -zp ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    -zt ./zkeys/TallyVotes_10-1-2_test.0.zkey \
    -t tally.json \
    -f proofs/

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
