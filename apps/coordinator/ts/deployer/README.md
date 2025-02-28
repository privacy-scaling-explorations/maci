# Deployer module

This module is responsible for the deployment actions of MACI. It replicates the steps that are described in `packages/contracts/tasks/deploy`. All its endpoints are protected by the `AccountSignatureGuard` middleware, which checks the signature of the request against the `COORDINATOR_ADDRESSES` environment variable.

1. **MACI contract deployment:** Deploy the set of contracts for MACI to work (voiceCredit, GateKeeper, verifier, poseidon, pollFactory, messageProcessorFactory, tallyFactor, vkRegistry and maci). The contract addresses and arguments are stored.

2. **Poll deployment:** Deploy a new poll to an existing MACI instance. The contract addresses and arguments of Poll, MessageProcessor and Tally are stored.
