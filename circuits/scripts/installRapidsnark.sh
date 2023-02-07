#!/bin/bash -xe

cd ~

rm -rf rapidsnark
git clone https://github.com/iden3/rapidsnark.git
cd rapidsnark
git checkout 1c13721de4a316b0b254c310ccec9341f5e2208e
npm install
git submodule init
git submodule update
npx task createFieldSources
npx task buildProver
