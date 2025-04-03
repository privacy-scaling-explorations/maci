---
title: Coordinator Service
description: The Coordinator Service is a service that allows to automate MACI coordinator tasks.
sidebar_label: Coordinator Service
sidebar_position: 10
---

# Coordinator Service

MACI’s coordinator service is a backend service that aims to automate MACI-related operations, such as contracts deployment, proof generation and poll finalisation.

Up until now, users of MACI have had to manually deploy the smart contracts using some scripts, which while pretty straightforward, they require the manual step of running them from a command line. The same goes for the finalisation of polls, which requires coordinators to check when a poll ends, and then run a number of scripts to process votes and tally them, as well as sending the results on chain. This prevents (or at a minimum makes it very difficult) non technical users from being coordinators of MACI.

With the coordinator service, a number of REST endpoints are exposed that allow client applications to perform the above tasks. For instance, now we can have frontend applications with intuitive interfaces to deploy and configure smart contracts. For poll finalisation, this can either be automated with a cron job, or triggered by a client application request.

For more details on how to use and integrate the coordinator service into your application, please refer to this [guide](/docs/technical-references/coordinator-service).
