---
title: Integrating MACI
description: How to integrate MACI into your application
sidebar_label: Integrating
sidebar_position: 1
---

MACI can be used in any protocol that requires collusion resistance, for instance it has been proven to be quite efficient when integrated in quadratic funding applications such as [clr.fund](https://github.com/clrfund/monorepo) and [qfi](https://github.com/quadratic-funding/qfi/tree/feat/code-freeze).

Here we will be looking at how the smart contracts can be integrated. Please note that this will be expanded as QFI is updated to use the newest version of MACI. Should you decide to integrate MACI in the meantime, feel free to open an issue on the GitHub repo.

## MACI Contract

The MACI contract is the core of the protocol. Contracts can inherit from MACI and thus expose the `signUp` and `deployPoll` functions. As with standalone MACI, one would need to deploy a [sign up gatekeeper](/docs/developers-references/smart-contracts/Gatekeepers) as well as the [voice credit proxy](/docs/developers-references/smart-contracts/VoiceCreditProxy).

As an example, a [contract](https://github.com/ctrlc03/minimalQF/blob/main/contracts/MinimalQf.sol#L113) could inherit from MACI and allows sign up via a custom signup function.

```javascript
function signUp(
    PubKey memory _pubKey,
    bytes memory _signUpGatekeeperData,
    bytes memory _initialVoiceCreditProxyData
) public override {
  // the amount must be set in the initial voice credit proxy data
  uint256 amount = abi.decode(_initialVoiceCreditProxyData, (uint256));

  // transfer tokens to this contract
  nativeToken.safeTransferFrom(msg.sender, address(this), amount);

  // the voice credits will be the amount divided by the factor
  // the factor should be decimals of the token
  // normal signup
  super.signUp(_pubKey, _signUpGatekeeperData, _initialVoiceCreditProxyData);

  // store the address of the user signing up and amount so they can be refunded just in case
  // the round is cancelled
  // they will be able to vote from different addresses though
  contributors[msg.sender] = amount;
}
```

## InitialVoiceCreditProxy

If you'd like to extend the functionality of how votes are distributed among users, you need to extend [InitialVoiceCreditProxy](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol) contract. You can see our [basic example](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/initialVoiceCreditProxy/ConstantInitialVoiceCreditProxy.sol) how it's implemented for constant distribution.

```ts
contract ConstantInitialVoiceCreditProxy is InitialVoiceCreditProxy {
  /// @notice the balance to be returned by getVoiceCredits
  uint256 internal balance;

  /// @notice creates a new ConstantInitialVoiceCreditProxy
  /// @param _balance the balance to be returned by getVoiceCredits
  constructor(uint256 _balance) payable {
    balance = _balance;
  }

  /// @notice Returns the constant balance for any new MACI's voter
  /// @return balance
  function getVoiceCredits(address, bytes memory) public view override returns (uint256) {
    return balance;
  }
}
```

## Poll Contract

On the other hand, the Poll contract can be inherited to expose functionality such as publishing of messages/commands.

For instance, should it be required to gatekeep who can send a message, overriding the `publishMessage` function could be the best way to go.

## Tally Contract

Given the verification functions being exposed by the Tally contract, quadratic funding protocols might require to extend the Tally contract to add distribution logic. Looking at this [example](https://github.com/ctrlc03/minimalQF/blob/main/contracts/MinimalQFTally.sol#L114) the `claimFunds` function is added to a contract inheriting from `Tally`, and uses functions such as `verifyPerVOSpentVoiceCredits` to distribute funds to projects part of a quadratic funding round.
