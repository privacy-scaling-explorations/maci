# Proof module

This module is responsible for the proving and tallying actions of MACI (aka. poll finalization). It replicates the steps that are described in `packages/contracts/tasks/runners` (specifically merge, prove and submitOnChain). All its endpoints are protected by the `AccountSignatureGuard` middleware, which checks the signature of the request against the `COORDINATOR_ADDRESSES` environment variable.

1. **Merge:** Merge siguns and messages (votes).

2. **Prove:** Generate proofs for the message processing. Remember that it could be divided by groups depending on the message batch size and the number of messages.

3. **Submit onchain:** Submit the proofs onchain. This is the final step of the process.
