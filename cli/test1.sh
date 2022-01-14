#!/bin/bash

node ./build/index.js create -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
	-s 15 \
	-o 15 \
	-bm 4 \
	-bv 4

node ./build/index.js signup -p macipk.08b869d7dcc59913301478bec3e7020c9ca37d44aae886fa7be118fca34daf06 \

node ./build/index.js publish -sk macisk.8d9bce75e0053db023ffd26597a4f389b33edd9236998e357cef36d5c978cc8 \
	-p macipk.08b869d7dcc59913301478bec3e7020c9ca37d44aae886fa7be118fca34daf06 \
	-i 1 \
	-v 1 \
	-w 9 \
	-n 1

rm -f macistate_test.json
node build/index.js timeTravel -s 30

node build/index.js genProofs \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -t tally.json \
    -m macistate_test.json

node build/index.js proveOnChain \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json 
