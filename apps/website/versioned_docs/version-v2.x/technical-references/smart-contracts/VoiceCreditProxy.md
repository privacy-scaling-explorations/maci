---
title: Voice Credits Proxy Smart Contract
description: Voice Credits Proxy smart contract
sidebar_label: VoiceCreditsProxy
sidebar_position: 7
---

:::info
Code location: [InitialVoiceCreditProxy](https://github.com/privacy-scaling-explorations/maci/tree/dev/contracts/contracts/initialVoiceCreditProxy)
:::

The VoiceCreditProxy contract is used to assign voice credits to users. Whichever implementation should the MACI deployers use, this must implement a view function that returns the balance for a user, such as the one below:

```javascript
function getVoiceCredits(address _user, bytes memory _data) public virtual view returns (uint256) {}
```

The repository comes with a simple implementation called `ConstantInitialVoiceCreditProxy` which assigns a fixed amount of voice credits to each user.
