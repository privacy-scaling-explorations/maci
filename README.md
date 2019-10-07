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

# Deploy contracts
npx truffle migrate --network development
```

## With Docker

```bash
docker-compose up
```

# Contribution
We are actively seeking help on implementing this project please join https://t.me/joinchat/LUgOpE7J2gstRcZqdERyvw and ask about contributions

And check the help wanted issues.