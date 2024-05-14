# Coordinator service

## Instructions

1. Add `.env` file (see `.env.example`).
2. Generate RSA key pair with `pnpm run generate-keypair`.
3. Download zkey files using `pnpm run download-zkeys:{type}` (only test type is available for now).
4. Make sure you copied RSA public key to your application. This will be needed for encrypting `Authorization` header and coordinator private key for proof generation.
5. Run `pnpm run start` to run the service.
6. All API calls must be called with `Authorization` header, where the value is encrypted with RSA public key, you generated before. Header value contains message signature and message digest created by `COORDINATOR_ADDRESS`. Format is `publicEncrypt({signature}:{digest})`.
   Make sure you set `COORDINATOR_ADDRESS` env variable and sign any message with this address from your application (see [AccountSignatureGuard](./ts/auth/AccountSignatureGuard.service.ts)).
7. Proofs can be generated with `POST v1/proof/generate` API method (see [dto spec](./ts/proof/dto.ts) and [controller](./ts/app.controller.ts)).
