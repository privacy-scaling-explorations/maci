---
title: Policies Smart Contract
description: Policies smart contract
sidebar_label: Policies
sidebar_position: 6
---

:::info
Code location: [Policies](https://github.com/privacy-scaling-explorations/excubiae/tree/main/packages/contracts/contracts/extensions)
:::

MACI is composed of multiple smart contracts, which together with the zk-SNARK circuits, can be used to carry out on-chain voting. Start with an [overview of our smart contracts here](/docs/technical-references/smart-contracts/MACI).

MACI uses a "policy" contract from Excubiae, which is used to configure and enforce the eligibility criteria of voters who can participate in MACI polls. In other words, it is a way to whitelist signups to the system. Operators of MACI can use the policy contract to configure signup eligibility and to protect against sybil attacks in their polls.

The MACI repository comes with several out-of-the-box options:

- `FreeForAllPolicy` - This allows anyone to signup on MACI.
- `SignUpTokenPolicy` - This restricts signups only to holders of a specific ERC721 token.
- `EASPolicy` - This restricts signups only to users who have received an attestation of a specific schema from a trusted attester.
- `HatsPolicy` - This allows gatekeeping signups to only users who have a specific [Hat](https://www.hatsprotocol.xyz/).
- `GitcoinPassportPolicy` - This allows gatekeeping signups to only users who have a specific [Gitcoin Passport](https://passport.gitcoin.co/) score.
- `ZupassPolicy` - This allows gatekeeping signups only to users who have a valid [Zupass PCD ticket](https://github.com/proofcarryingdata/zupass).
- `SemaphorePolicy` - This allows gatekeeping signups only to users who can prove they are part of a [Semaphore](https://semaphore.pse.dev/) group.

You can find all of the latest policy contracts here:
https://github.com/privacy-scaling-explorations/excubiae/tree/main/packages/contracts/contracts/extensions

Developers are also welcome to implement a custom policy contract as long as it conforms to the `BasePolicy` - an abstract contract to inherit from with function signature:

```ts
abstract contract BasePolicy {
    function enforce(address subject, bytes calldata evidence) external override onlyTarget {}
}
```

Whenever a user signs up (via the `MACI.signUp` function), this triggers the MACI contract to call the `BasePolicy.enforce` function. Please note that this function should throw if the user is not eligible to sign up, rather than returning true or false.

If you'd like to create a policy contract for your project, or if there's specific policy functionality you'd like to see MACI support, we'd be happy to help! Please [create a GitHub issue](https://github.com/privacy-scaling-explorations/maci/issues/new/choose).
