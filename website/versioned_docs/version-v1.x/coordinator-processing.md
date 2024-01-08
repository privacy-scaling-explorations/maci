---
title: Coordinator local processing
description: How does the coordinator process and tallies messages locally
sidebar_label: Coordinator local processing
sidebar_position: 14
---

# Coordinator local processing

The coordinator is responsible for processing and tallying messages locally, before generating proofs that this was done correctly using the zk-SNARK circuits.

To summarize, the coordinator's goal here is to process all of the messages that were submitted by MACI's voters, then tally the votes based on the valid vote messages. Furthermore, each batch processed should be able to be verified by a zk-SNARK proof.

## Which MACI's components are involved

The following diagram, shows which components are involved and at which step of the way

![components involved](/img/coordinatorComponents.svg)

## What does the process look like?

![processing](/img/offlineProcessing.svg)

Zooming in..

**Message processing**

![message processing](/img/messageProcessingLocal.svg)

**Vote tallying**

![vote tallying](/img/voteTallyingLocal.svg)

## What does the process look like when including the zk-SNARK proofs

**Process of completing a Poll**

![processing with proofs](/img/completingAPoll.svg)

**Process of generating proofs**

![generating proofs](/img/generateProofs.svg)

**Tally commitments**

![tally commitments](/img/tallyCommitments.svg)
