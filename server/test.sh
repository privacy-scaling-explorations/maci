#!/bin/bash

# admin deploy contracts and store info into database
./admin.sh deploy
./admin.sh store

# user signup & publish messages
pk=macipk.d49f1ed2fd22ca7e3bf96a5d3bcf245e6b440fc77cfa360ae50ff7b67990fb1e 
sk=macisk.27281729e0ece51695bd064eeb4215da20498e19bd4eeab75f83b99ed80226b5 
maci=0x9F544a3Fc3D1045e6ec49D4ecEF6dCD700457165 
./user.sh publish -p $pk -x $maci -sk $sk -i 1 -v 0 -w 9 -n 1 -o 0


# admin prove and submit on-chain

# user verify proof
