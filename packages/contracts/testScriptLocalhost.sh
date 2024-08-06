#! /bin/bash

pnpm run deploy:localhost

pnpm run deploy-poll:localhost

sleep 30 # wait for voting period is over

pnpm run merge:localhost --poll 0

pnpm run prove:localhost --poll 0 \
    --coordinator-private-key "macisk.1751146b59d32e3c0d7426de411218172428263f93b2fc4d981c036047a4d8c0" \
    --tally-file ../cli/tally.json \
    --output-dir ../cli/proofs/
