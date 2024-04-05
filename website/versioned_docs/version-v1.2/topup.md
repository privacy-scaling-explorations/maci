---
title: MACI Topup
description: How the Topup feature works
sidebar_label: Topup
sidebar_position: 22
---

# Topup

MACI v1.1.1 introduced the topup feature. This was developed by [chaosma](https://github.com/chaosma): you can find more information on their [post](https://hackmd.io/@chaosma/rkyPfI7Iq) and the original idea post [here](https://hackmd.io/@ef-zkp/rk6uaQBrI).

In a nutshell, this feature was added to support some application like quadratic funding, where once a user uses all of their voice credits when voting, they would need to signup again to be able to vote again. This is not ideal, and thus with this feature, a user can topup their voice credits, and continue to vote for a poll/quadratic funding round.

## How topup messages are processed

Topup messages are submitted on chain using the same smart contract used for voting, [`Poll`](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/Poll.sol). With the current design, a TopUpCredit token smart contract is required. In this implementation of MACI, there is an example token, which is an ERC20 contract with 1 decimal, of which the coordinator (or MACI's operator) has ownership of. This privileged figure can mint tokens to users (at their discretion) and users will need to deposit such tokens to the Poll contract in order to topup their voice credits.

:::info
MACI is not concerned with the way of distributing such tokens. The operators of the MACI instance should implement their own way of distributing such tokens, as well as withdrawing them from the Poll contract. For instance, if the operator chooses to use a token with a monetary value, the Poll balance could be withdrawn and sent to fund public goods.
:::

To submit a topup message, a user will then need to call the TopUpCredit token approve function and approve the Poll contract to spend their tokens. Then, they will need to call the `topup` function in the Poll contract, passing the amount of tokens they want to topup and their state index.

## Considerations

### Voice credits

:::danger
As a MACI operator, you should be aware that voice credits should ideally be small values (< 2 \*\* 32) to avoid overflows or issues in the circuits operations. It is recommended to use a factor to scale down voice credits in the smart contract.
:::

### Reverse processing

As with normal vote messages (or key changes), topup messages are processed in [reverse order](https://maci.pse.dev/docs/key-change/#why-are-messages-processed-in-reverse-order), you should be aware that as a user, you will first need to spend your voice credits, then topup.

Here is an [extract from Chao's post](https://hackmd.io/@chaosma/rkyPfI7Iq#Remarks):

> With above design, the order of vote type and topup type message matters. MACI process the message queue in reverse order. Suppose the initial > credit balance for any user is 100. Consider the following two scenarios in message queue:
>
> **Case 1** > [topup(balance=350), vote(weight=20,nonce=2), vote(weight=9,nonce=1)]
>
> **case 2** > [vote(weight=20,nonce=2), topup(balance=350), vote(weight=9,nonce=1)]  
> The first case, the topup message is processed at last, so the vote(weight=20,nonce=2) will fail because 20 \* 20 > 100. vote(weight=9,nonce=1) is the final result. In the second case, the topup message is processed before the second vote, so vote(weight=20,nonce=2) will invalidate the first vote and become the final result.
