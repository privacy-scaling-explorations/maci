#!/bin/bash -xe

cd ~

rm -rf rapidsnark
git clone https://github.com/iden3/rapidsnark.git
cd rapidsnark
pnpm install
git submodule init
git submodule update
pnpm exec task createFieldSources
pnpm exec task buildProver
