# MACI
Minimal Anti-Collusion Infrastructure

This project is based upon https://ethresear.ch/t/minimal-anti-collusion-infrastructure

# Developing on MACI

MACI is tested with `node v10.16.3`

```bash
yarn install

yarn circuit:compile
yarn circuit:setup
yarn circuit:generateverifier

# Runs app/utils/crypto.js .... for now ....
# Will make it prettier dw
yarn circuit:test

# Deploy contracts
truffle migrate --network development
```

## With Docker

```bash
docker build -t maci .
docker exec -it $(docker run -t -d maci) /bin/bash

yarn circuit:compile
yarn circuit:setup
yarn circuit:generateverifier

yarn circuit:test # app/utils/crypto.js
```

# Contribution
We are actively seeking help on implementing this project please join https://t.me/joinchat/LUgOpE7J2gstRcZqdERyvw and ask about contributions

And check the help wanted issues.