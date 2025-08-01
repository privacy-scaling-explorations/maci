# Coordinator service

Please refer to [Offchain relayer service documentation](https://maci.pse.dev/docs/category/offchain-relayer) for more information.

## Requirements

1. [Node.js](https://nodejs.org/en) version 20.0.0.
2. [pnpm](https://pnpm.io/installation) package manager.
3. [rapidsnark](https://github.com/iden3/rapidsnark) program.

## Instructions

1. Add `.env` file (see `.env.example`).
2. Remember to set up the rapidsnark file variable.
3. Generate RSA key pair with `pnpm run generate-keypair`.
4. Download zkey files using `pnpm run download-zkeys:{type}` (only test type is available for now).
5. Make sure you copied RSA public key to your application. This will be needed for encrypting `Authorization` header and coordinator private key for proof generation. Also it can be accessed through API method `GET v1/proof/publicKey`.
6. Run `pnpm run start` to run the service.
7. All API calls must be called with `Authorization` header, where the value is encrypted with RSA public key you generated before. Header value contains message signature and message digest created by `COORDINATOR_ADDRESSES`. The format is `publicEncrypt({signature}:{digest})`.
   Make sure you set `COORDINATOR_ADDRESSES` env variable and sign any message with the addresses from your application (see [AccountSignatureGuard](./ts/auth/AccountSignatureGuard.service.ts)).
8. Proofs can be generated with `POST v1/proof/generate` API method or with Websockets (see [dto spec](./ts/proof/dto.ts), [controller](./ts/app.controller.ts) and [wsgateway](./ts/events/events.gateway.ts)).

## Subgraph deployment

It is possible to deploy subgraph using coordinator service.

First, you need to setup subgraph and create a project. [Subgraph dashboard](https://thegraph.com/studio/).

Then, set env variables:

```
# Subgraph name
SUBGRAPH_NAME="maci-subgraph"

# Subgraph provider url
SUBGRAPH_PROVIDER_URL=https://api.studio.thegraph.com/deploy/

# Subgraph deploy key
SUBGRAPH_DEPLOY_KEY=*******

# Subgraph project folder
SUBGRAPH_FOLDER=../subgraph
```

After deployment, subgraph url will be available in studio dashboard and you can use this type of url to get latest deployed version in your application:

```
https://api.studio.thegraph.com/.../{SUBGRAPH_NAME}/version/latest
```

## Docker

Remember to run it from the monorepo root directory.

```bash
# Build docker
docker compose -f apps/coordinator/docker-compose.yml build

# Run container detached
docker compose -f apps/coordinator/docker-compose.yml up -d

# Enter the container
docker compose -f apps/coordinator/docker-compose.yml exec coordinator-service /bin/sh

# Stop container
docker compose -f apps/coordinator/docker-compose.yml down
```
