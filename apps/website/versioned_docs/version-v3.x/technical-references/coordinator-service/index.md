---
title: Introduction
description: The Coordinator Service is a service that allows to automate MACI coordinator tasks.
sidebar_label: Introduction
sidebar_position: 1
---

# Coordinator Service

Welcome to the Coordinator Service technical reference. This guide describes how the Coordinator Service work, workflow and how to interact with it. For more the technical code documentation regarding API endpoints and data transfer objects, please refer to the [API documentation](https://coordinator.maci.vote/api) in any deployed instance of the service.

## Responsibilities

A MACI coordinator is responsible for running voting processes. In quadratic funding rounds or authorities election rounds, the coordinator is the entity that defines who can vote, what projects or candidates are eligible for funding and the duration of the voting round.

First of all, the coordinator needs to deploy the MACI smart contracts with the desired configuration: gatekeeper policy which defines who can sign up as a voter, the state merkle tree depth which defines the maximum number of voters, and the voting mode which defines how votes will be counted (more info in [Poll types](https://maci.pse.dev/docs/core-concepts/poll-types#quadratic-voting)).

After deploying the MACI contracts, the coordinator can deploy a poll (which represents a voting process). To deploy the poll the coordinator needs to specify: the gatekeeper policy which defines who can join the poll as voter, the start and end date of the poll, the number of options to vote for, the maximum number of votes per voter, and the voting mode.

The coordinator then will wait until the poll ends and then it will need to finalise the poll. This involves processing all published messages, extracting the votes, tallying them and submitting the results on chain.

## Conclusion

In the next documents we will go through the details of setting up the coordinator service and how to interact with it to perform the tasks described above.
