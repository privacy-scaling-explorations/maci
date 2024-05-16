---
title: Gatekeepers Smart Contract
description: Gatekeepers smart contract
sidebar_label: Gatekeepers
sidebar_position: 6
---

MACI requires a signup gatekeeper to ensure that only designed users register. It is up to MACI's deployer how they wish to allow sign-ups, therefore they can implement their own GateKeeper. The repository comes with different options:

- `FreeForAllSignUpGatekeeper` - This allows anyone to signup on MACI.
- `SignUpTokenGatekeeper` - This makes use of a ERC721 token to gatekeep the signup function.
- `EASGatekeeper` - This allows gatekeeping signups to only users who have a specific EAS attestation.
- `HatsGatekeeper` - This allows gatekeeping signups to only users who have a specific Hat.
- `GitcoinPassportGatekeeper` - This allows gatekeeping signups to only users who have a specific Gitcoin Passport score.

An abstract contract to inherit from is also provided, with two function signatures as shown below:

```ts
abstract contract SignUpGatekeeper {
    function setMaciInstance(MACI _maci) public virtual {}
    function register(address _user, bytes memory _data) public virtual {}
}
```

The MACI contract will need to call the `SignUpGatekeeper.register` function inside the `MACI.signUp` function.
