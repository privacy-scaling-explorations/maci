#!/bin/bash

# 1. admin deploy contracts and store info into database
./admin.sh deploy
./admin.sh store

# 2. user signup & publish messages
pk=macipk.d49f1ed2fd22ca7e3bf96a5d3bcf245e6b440fc77cfa360ae50ff7b67990fb1e 
sk=macisk.27281729e0ece51695bd064eeb4215da20498e19bd4eeab75f83b99ed80226b5 
maci=0xf204a4Ef082f5c04bB89F7D5E6568B796096735a

./user.sh signup -p $pk -x $maci
./user.sh publish -p $pk -x $maci -sk $sk -i 1 -v 0 -w 9 -n 1 -o 0


DirName=$(dirname $0)
tally_file=$DirName/../cli/tally.json 
prove_file=$DirName/../cli/proofs.json
rm -f $tally_file $prove_file
# 3. admin prove and submit on-chain
./admin.sh process

# 4. user verify proof
pid=0
./user.sh verify -t $tally_file -x $maci -o $pid
