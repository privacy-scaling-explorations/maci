# one signup and one valid message

node build/index.js deployVkRegistry && \
node build/index.js setVerifyingKeys -s 10 -i 1 -m 2 -v 2 -b 1 \
    -p ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey \
    -t ./zkeys/TallyVotes_10-1-2.test.0.zkey \
    -k 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0 && \
node build/index.js create \
    -r 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0 && \
node ./build/index.js deployPoll -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -pk macipk.495140c99cbc090c74363d5e3f32705a92a9e1df8e5ebe2fd6831de9c813f01f \
    -t 20 -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2 && \
node ./build/index.js signup -p macipk.b8590fdba5e9cde5606dad5db384be4d253d0a2064d1e03f9600ee021a7ebe16 \
    -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a && \
node build/index.js publish \
    -p macipk.b8590fdba5e9cde5606dad5db384be4d253d0a2064d1e03f9600ee021a7ebe16 \
    -sk macisk.2ae4f199bf3925a2407f7c775c9261f351ab861d8e9ecbb84622bdd3f6d41b08 \
    -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -i 1 -v 0 -w 9 -n 1 -o 0
    
node build/index.js timeTravel -s 30 && \
node build/index.js mergeMessages -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -o 0 && \
node build/index.js mergeSignups -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -o 0 && \
rm -f tally.json proofs.json && \
node build/index.js genProofs -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -sk macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
    -o 0 \
    -r ~/rapidsnark/build/prover \
    -wp ./zkeys/ProcessMessages_10-2-1-2.test \
    -wt ./zkeys/TallyVotes_10-1-2.test \
    -zp ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey \
    -zt ./zkeys/TallyVotes_10-1-2.test.0.zkey \
    -t tally.json \
    -f proofs.json

node build/index.js proveOnChain \
    -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -o 0 \
    -q 0xEcFcaB0A285d3380E488A39B4BB21e777f8A4EaC \
    -f proofs.json

node build/index.js verify \
    -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    -o 0 \
    -t tally.json \
    -q 0xEcFcaB0A285d3380E488A39B4BB21e777f8A4EaC
