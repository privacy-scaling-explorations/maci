# Session Keys module

This module is responsible for session keys management. These keys (private are stored in the service, public are sent to the client) are used to generate the ZeroDev KernelClient. This way we are not storing any master keypair in the server that could be stolen. The point of these sessions keys were that they would be short-lived (~2min). All its endpoints are protected by the `AccountSignatureGuard` middleware, which checks the signature of the request against the `COORDINATOR_ADDRESSES` environment variable.

[More info.](https://github.com/privacy-scaling-explorations/maci/issues/1630)

1. **Generate:** creates a random keypair: private and public keys. It saves the private key in local storage and sends the public key to the user. The user then sends this public key as sessionKeys in the body in different calls (e.g. `deploy/maci`) so the service can generate a kernelClient (using the saved private key) and send transactions.

2. **Delete:** deletes the private key from local storage. This is used when the user wants to revoke access to the service.
