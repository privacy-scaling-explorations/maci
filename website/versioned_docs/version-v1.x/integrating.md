---
title: Integrating MACI
description: How to integrate MACI into your application
sidebar_label: Integrating
sidebar_position: 11
---

# Integrating MACI

MACI can be used in any protocol that requires collusion resistance, for instance it has been proven to be quite efficient when integrated in quadratic funding applications such as [clr.fund](https://github.com/clrfund/monorepo) and [qfi](https://github.com/quadratic-funding/qfi/tree/feat/code-freeze).

Here we will be looking at QFI and how it was used. Please note that this will be expanded as QFI is updated to use the newest version of MACI. Should you decide to integrate MACI in the meantime, feel free to open an issue on the GitHub repo.

## MACI Contract

The MACI contract is the core of the protocol. Contracts can inherit from MACI and thus expose the signup and topup functions. As with standalone MACI, one would need to deploy a [sign up gatekeeper](./contracts#signupgatekeeper) as well as the [voice credit proxy](./contracts#voicecreditproxy).

As an example, within the quadratic funding infrastructure project, the QFI contract inherits from MACI and allows sign up via the contribute function.

```javascript
function contribute(
    PubKey calldata pubKey,
    uint256 amount
    ) external {

    [..snip]

    uint256 voiceCredits = amount / voiceCreditFactor;
    // The user is marked as registered here upon contribution
    grantRoundToContributors[nextGrantRoundId][msg.sender] = ContributorStatus(voiceCredits, true);

    // Increase the number of contributors for this round
    grantRoundToContributorsCount[nextGrantRoundId]++;

    bytes memory signUpGatekeeperAndInitialVoiceCreditProxyData = abi.encode(
        msg.sender,
        voiceCredits
    );

    signUp(
        pubKey,
        signUpGatekeeperAndInitialVoiceCreditProxyData,
        signUpGatekeeperAndInitialVoiceCreditProxyData
    );

    [..snip]

    emit ContributionSent(msg.sender, amount);
}
```

## Poll Contract

On the other hand, the Poll contract can be inherited to expose functionality such as top ups and publishing of messages/commands.

For instance, within QFI, the `publishMessageBatch` function call the `publishMessage` function of Poll, as shown below:

```javascript
function publishMessageBatch(
    Message[] calldata _messages,
    PubKey[] calldata _encPubKeys
) external {
    // Check that the two arrays have the same length
    require(
        _messages.length == _encPubKeys.length,
        "GrantRound: _messages and _encPubKeys should be the same length"
    );

    uint256 batchSize = _messages.length;
    for (uint8 i = 0; i < batchSize; ++i) {
        publishMessage(_messages[i], _encPubKeys[i]);
    }

    emit Voted(msg.sender);
}
```
