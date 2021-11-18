#!/bin/bash

node ./build/index.js create -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
	-e http://localhost:8545 \
	-s 15 \
	-o 15 \
	-bm 4 \
	-bv 4

node ./build/index.js signup -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-e http://localhost:8545 \
	-p macipk.08b869d7dcc59913301478bec3e7020c9ca37d44aae886fa7be118fca34daf06 \
	-x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4

node ./build/index.js publish -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
	-e http://localhost:8545 \
	-x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
	-sk macisk.8d9bce75e0053db023ffd26597a4f389b33edd9236998e357cef36d5c978cc8 \
	-p macipk.08b869d7dcc59913301478bec3e7020c9ca37d44aae886fa7be118fca34daf06 \
	-i 1 \
	-v 1 \
	-w 9 \
	-n 1

rm -f macistate_test.json
sleep 12

node build/index.js genProofs \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -t tally.json \
    -m macistate_test.json

node build/index.js proveOnChain \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
