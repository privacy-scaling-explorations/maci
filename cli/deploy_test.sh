# one signup and one valid message

cordsk=macisk.27281729e0ece51695bd064eeb4215da20498e19bd4eeab75f83b99ed80226b5
cordpk=macipk.d49f1ed2fd22ca7e3bf96a5d3bcf245e6b440fc77cfa360ae50ff7b67990fb1e

node build/index.js deployVkRegistry  && \
node build/index.js setVerifyingKeys -s 10 -i 1 -m 2 -v 2 -b 1 \
    -p ./zkeys/ProcessMessages_10-2-1-2.test.0.zkey \
    -t ./zkeys/TallyVotes_10-1-2.test.0.zkey  && \
node build/index.js create  && \
node ./build/index.js deployPoll \
    -pk $cordpk \
    -t 20 -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2  && \
node ./build/index.js deployPoll \
    -pk $cordpk \
    -t 20 -g 25 -mv 25 -i 1 -m 2 -b 1 -v 2  
