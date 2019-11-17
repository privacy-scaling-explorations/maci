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

# Test contracts
yarn contract:test

# Test circuits
yarn circuit:test

# Running tests
# NOTE: You'll need to have postgresql and redis setup
#       You can setup the infrastructure with `docker-compose up`
#       in another terminal
yarn test
```

# Deployment

## Environment variables

### Recommended
- `ENV_TYPE`: 'PROD' | 'DEV' | 'TEST'

- `MACI_CONTRACT_ADDRESS`: Address of deployed MACI contract
- `CMD_TREE_ADDRESS`: Address of deployed merkle tree contract
- `SIGN_UP_TOKEN_ADDRESS`: Address of deployed ERC721 token contract

- `DB_USER`: Postgres DB username
- `DB_PASSWORD`: Postgres DB password
- `DB_HOST`: Postgres host
- `DB_PORT`: Postgres port
- `DB_NAME`: Postgres database name

- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `REDIS_PASSWORD`: Redis password

### Optional
- `MERKLE_TREE_DEPTH`: Depth of the merkle tree (Defaults to 4)
- `SIGN_UP_BLOCK_DURATION`: Number of blocks allocated for the sign up process (default: 20)

- `COORDINATOR_PRIVATE_KEY`: Private key of the Coordinator 

# Contribution
We are actively seeking help on implementing this project please join https://t.me/joinchat/LUgOpE7J2gstRcZqdERyvw and ask about contributions

And check the help wanted issues.
