---
title: Offchain Voting
description: The Offchain Voting is a service that allows users to vote on MACI polls free of charge.
sidebar_label: Offchain Voting
sidebar_position: 11
---

# Coordinator Service

MACI’s offchain voting service is a backend service that allows users to vote on MACI polls free of charge. This originated from [Vitalik's post](https://ethresear.ch/t/maci-with-mostly-off-chain-happy-path/19527).

In order to improve inclusivity of MACI polls, a coordinator can spin up the offchain relayer service to allow voters to submit their choices off-chain, saving on gas costs. Voters can check whether their vote has been submitted successfully by using relayer SDK, and if they believe they have been censored, can directly submit their vote on chain, using MACI in its normal form.

For more details on how to use and integrate the offchain relayer service into your application, please refer to this [guide](/docs/technical-references/offchain-relayer).
