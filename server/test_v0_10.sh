#!/bin/bash

# 1. admin deploy contracts and store info into database
./admin_v0_10.sh deploy
./admin_v0_10.sh store

# 2. user signup & publish messages
pk=macipk.d49f1ed2fd22ca7e3bf96a5d3bcf245e6b440fc77cfa360ae50ff7b67990fb1e 
sk=macisk.27281729e0ece51695bd064eeb4215da20498e19bd4eeab75f83b99ed80226b5 
maci=0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4
./user_v0_10.sh signup -p $pk -x $maci
./user_v0_10.sh publish -p $pk -x $maci -sk $sk -i 1 -v 0 -w 9 -n 1 


CliDirName=$(dirname $0)/../../v0.10/cli
maci_state_file=$CliDirName/macistate_test.json 
rm -f $maci_state_file
# 3. admin prove and submit on-chain
./admin_v0_10.sh process

