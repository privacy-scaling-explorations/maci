---
title: MACI Gatekeepers
description: MACI uses a "gatekeeper" contract, which is used to determine the eligibility criteria of voters who can participate in MACI polls
sidebar_label: Gatekeepers
---

# MACI Gatekeepers

MACI is composed of multiple smart contracts, which together with the zk-SNARK circuits, can be used to carry out on-chain voting. Start with an [overview of our smart contracts here](/docs/contracts).

MACI uses a "gatekeeper" contract, which is used to configure and enforce the eligibility criteria of voters who can participate in MACI polls. In other words, it is a way to whitelist signups to the system. Operators of MACI can use the gatekeeper contract to configure signup eligibility and to protect agaisnt sybil attacks in their polls.

The MACI repository comes with several out-of-the-box options:

- `FreeForAllSignUpGatekeeper` - This allows anyone to sign up.
- `SignUpTokenGatekeeper` - This restricts signups only to addresses that own a certain ERC-721 token.
- `EASGatekeeper` - This restricts signups only to addresses who have received an attestation of a specific schema from a trusted attester.

[Find all of our latest gatekeeper contracts here](https://github.com/privacy-scaling-explorations/maci/tree/dev/contracts/contracts/gatekeepers).

Developers are also welcome to implement a custom gatekeeper contract as long as it conforms to the [`SignUpGatekeeper`](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/gatekeepers/SignUpGatekeeper.sol) - an abstract contract to inherit from with two function signatures:

```ts
abstract contract SignUpGatekeeper {
    function setMaciInstance(MACI _maci) public virtual {}
    function register(address _user, bytes memory _data) public virtual {}
}
```

Whenever a user signs, up (via the `MACI.signUp` function), this triggers the MACI contract to call the `SignUpGatekeeper.register` function.

If you'd like to create a gatekeeper contract for your project, or if there's specific gatekeeper functionality you'd like to see MACI support, we'd be happy to help - please [create a GitHub issue](https://github.com/privacy-scaling-explorations/maci/issues/new/choose)!
