#!/bin/bash

pnpm exec zkey-manager compile -c ../zkeys.config.yml
pnpm exec zkey-manager downloadPtau -c ../zkeys.config.yml
pnpm exec zkey-manager genZkeys -c ../zkeys.config.yml



