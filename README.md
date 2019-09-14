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
```

## With Docker

```
docker build -t maci .
docker run exec -it maci -- /bin/bash
```

# Contribution
We are actively seeking help on implementing this project please join https://t.me/joinchat/LUgOpE7J2gstRcZqdERyvw and ask about contributions

And check the help wanted issues.