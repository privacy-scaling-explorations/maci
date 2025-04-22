# Subgraph module

This module is responsible for the deployment of the subgraph for MACI. It automates the process described in `packages/subgraph`. All its endpoints are protected by the `AccountSignatureGuard` middleware, which checks the signature of the request against the `COORDINATOR_ADDRESSES` environment variable.

**IMPORTANT:** The Graph Studio UI is a bit confusing. You need the DEPLOY_KEY from "My Dashboard" -> "maci-subgraph" -> "DEPLOY KEY". It is not the API key on the top navbar.
