# MACI
Minimal Anti-Collusion Infrastructure

This project is based upon https://ethresear.ch/t/minimal-anti-collusion-infrastructure

# Developing on MACI

MACI is tested with `node v10.16.3`

```bash
# Install dependencies
yarn install

# Generate the circuits
yarn circuit:compile
yarn circuit:setup
yarn circuit:generateverifier

# Deploy contracts
yarn ganache
npx truffle migrate --network development

# Running coordinator service
yarn start

# Running coordinator service (development mode)
yarn dev

# Running tests
# NOTE: You'll need to have postgresql and redis setup
#       You can setup the infrastructure with `docker-compose up`
#       in another terminal
yarn test
```

# Deployment

## Environment variables

### Required

### Optional
- ``
- `MERKLE_TREE_DEPTH`: Depth of the merkle tree (Defaults to 4)


# Contribution
We are actively seeking help on implementing this project please join https://t.me/joinchat/LUgOpE7J2gstRcZqdERyvw and ask about contributions

And check the help wanted issues.
