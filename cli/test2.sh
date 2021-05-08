# 4 signups, 6 messages
node build/index.js deployVkRegistry

node build/index.js setVerifyingKeys -s 10 -i 1 -m 2 -v 2 -b 1 -p ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey -t ./zkeys/TallyVotes_10-1-2.test.0.zkey -k 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0

node build/index.js create -r 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0

node build/index.js deployPoll -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -pk macipk.9f1b3cd9460639a1039c0a18e65280eb60642a232414fab8f620c69c081f819b -t 20 -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2

node ../cli/build/index.js signup -p macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a
node ../cli/build/index.js signup -p macipk.193c37dcb7db9bca854448e2b99b5d7e33e4c8a6f032e472a32578972e64031a -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a
node ../cli/build/index.js signup -p macipk.c380cb7b743da3ee6f72f847f3f8e0ab2a49fe4326547d1784555b04add4cc2c -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a
node ../cli/build/index.js signup -p macipk.4e1bdd5cbe0cfc9aa5b28cf0e7440932b689abd5e19072162495d312f3cc6525 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a

node build/index.js publish -sk macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa -p macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 1 -v 0 -w 1 -n 1 -o 0                 

node build/index.js publish -sk macisk.12b56eaf1cfb62afa850060f493744ca2d8afc4687ce8c1683fc26f31acf7b84 -p macipk.193c37dcb7db9bca854448e2b99b5d7e33e4c8a6f032e472a32578972e64031a -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 2 -v 1 -w 1 -n 1 -o 0                 

node build/index.js publish -sk macisk.6f6b490c3a08bf46a0f419d77058a633fad73e3f03d8113b499a649e57bb325 -p macipk.c380cb7b743da3ee6f72f847f3f8e0ab2a49fe4326547d1784555b04add4cc2c -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 3 -v 2 -w 1 -n 1 -o 0                  

node build/index.js publish -sk macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd -p macipk.4e1bdd5cbe0cfc9aa5b28cf0e7440932b689abd5e19072162495d312f3cc6525 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 4 -v 3 -w 1 -n 1 -o 0

node build/index.js publish -sk macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd -p macipk.4e1bdd5cbe0cfc9aa5b28cf0e7440932b689abd5e19072162495d312f3cc6525 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 4 -v 3 -w 1 -n 1 -o 0

node build/index.js publish -sk macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd -p macipk.4e1bdd5cbe0cfc9aa5b28cf0e7440932b689abd5e19072162495d312f3cc6525 -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -i 4 -v 3 -w 1 -n 1 -o 0

node build/index.js timeTravel -s 30

node build/index.js mergeSignups -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -o 0
node build/index.js mergeMessages -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -o 0

rm -f proofs.json tally.json

node build/index.js genProofs -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a -sk macisk.1b421413d3e82a3e955b591b2d8f943032537e7a8634223710c6c0f0094a058b -o 0 -r ~/rapidsnark/build/prover -wp ./zkeys/ProcessMessages_10-2-1-2.test -wt ./zkeys/TallyVotes_10-1-2.test -zp ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey -zt ./zkeys/TallyVotes_10-1-2.test.0.zkey -t tally.json -f proofs.json

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
