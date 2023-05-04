#!/bin/bash

npx zkey-manager compile -c zkeys.config.yml
npx zkey-manager downloadPtau -c zkeys.config.yml -nc
npx zkey-manager genZkeys -c zkeys.config.yml



