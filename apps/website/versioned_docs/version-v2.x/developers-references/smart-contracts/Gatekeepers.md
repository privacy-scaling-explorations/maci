---
title: Gatekeepers Smart Contract
description: Gatekeepers smart contract
sidebar_label: Gatekeepers
sidebar_position: 6
---

:::info
Code location: [Gatekeepers](https://github.com/privacy-scaling-explorations/maci/tree/dev/contracts/contracts/gatekeepers)
:::

MACI is composed of multiple smart contracts, which together with the zk-SNARK circuits, can be used to carry out on-chain voting. Start with an [overview of our smart contracts here](/docs/developers-references/smart-contracts/MACI).

MACI uses a "gatekeeper" contract, which is used to configure and enforce the eligibility criteria of voters who can participate in MACI polls. In other words, it is a way to whitelist signups to the system. Operators of MACI can use the gatekeeper contract to configure signup eligibility and to protect against sybil attacks in their polls.

The MACI repository comes with several out-of-the-box options:

- `FreeForAllGatekeeper` - This allows anyone to signup on MACI.
- `SignUpTokenGatekeeper` - This restricts signups only to holders of a specific ERC721 token.
- `EASGatekeeper` - This restricts signups only to users who have received an attestation of a specific schema from a trusted attester.
- `HatsGatekeeper` - This allows gatekeeping signups to only users who have a specific [Hat](https://www.hatsprotocol.xyz/).
- `GitcoinPassportGatekeeper` - This allows gatekeeping signups to only users who have a specific [Gitcoin Passport](https://passport.gitcoin.co/) score.
- `ZupassGatekeeper` - This allows gatekeeping signups only to users who have a valid [Zupass PCD ticket](https://github.com/proofcarryingdata/zupass).
- `SemaphoreGatekeeper` - This allows gatekeeping signups only to users who can prove they are part of a [Semaphore](https://semaphore.pse.dev/) group.

You can find all of our latest gatekeeper contracts here:
https://github.com/privacy-scaling-explorations/maci/tree/dev/contracts/contracts/gatekeepers

Developers are also welcome to implement a custom gatekeeper contract as long as it conforms to the `SignUpGatekeeper` - an abstract contract to inherit from with two function signatures:

```ts
abstract contract SignUpGatekeeper {
    function setMaciInstance(MACI _maci) public virtual {}
    function register(address _user, bytes memory _data) public virtual {}
}
```

Whenever a user signs up (via the `MACI.signUp` function), this triggers the MACI contract to call the `SignUpGatekeeper.register` function. Please note that this function should throw if the user is not eligible to sign up, rather than returning true or false.

If you'd like to create a gatekeeper contract for your project, or if there's specific gatekeeper functionality you'd like to see MACI support, we'd be happy to help! Please [create a GitHub issue](https://github.com/privacy-scaling-explorations/maci/issues/new/choose).
