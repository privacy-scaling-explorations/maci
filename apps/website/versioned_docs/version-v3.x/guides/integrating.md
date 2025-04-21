---
title: Integrating MACI
description: How to integrate MACI into your application
sidebar_label: Integrating
sidebar_position: 5
---

MACI can be used in any protocol that requires collusion resistance, for instance it has been proven to be quite efficient when integrated in quadratic funding applications such as [clr.fund](https://github.com/clrfund/monorepo), [qfi](https://github.com/quadratic-gardens/qfi/tree/main), [MACI Platform](https://github.com/privacy-scaling-explorations/maci-platform), and the [Gitcoin Allo Stack](https://github.com/gitcoinco/MACI_QF).

Here we will be looking at how the smart contracts can be integrated.

## MACI Contract

The MACI contract is the core of the protocol. Contracts can inherit from MACI and thus expose the `signUp` and `deployPoll` functions. As with standalone MACI, one would need to deploy a [sign up policy](/docs/technical-references/smart-contracts/Policies).

As an example, a [contract](https://github.com/ctrlc03/minimalQF/blob/main/contracts/MinimalQf.sol#L113) could inherit from MACI and allows sign up via a custom signup function.

```javascript
/// @inheritdoc IMACI
function signUp(PublicKey memory _publicKey, bytes memory _signUpPolicyData) public virtual {
  // ensure we do not have more signups than what the circuits support
  if (leanIMTData.size >= maxSignups) revert TooManySignups();

  // ensure that the public key is on the baby jubjub curve
  if (!CurveBabyJubJub.isOnCurve(_publicKey.x, _publicKey.y)) {
    revert InvalidPubKey();
  }

  // Register the user via the sign-up policy. This function should
  // throw if the user has already registered or if ineligible to do so.
  signUpPolicy.enforce(msg.sender, _signUpPolicyData);

  // Hash the public key and insert it into the tree.
  uint256 pubKeyHash = hashLeftRight(_publicKey.x, _publicKey.y);
  uint256 stateRoot = InternalLeanIMT._insert(leanIMTData, pubKeyHash);

  // Store the current state tree root in the array
  stateRootsOnSignUp.push(stateRoot);

  emit SignUp(leanIMTData.size - 1, block.timestamp, _publicKey.x, _publicKey.y);
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

On the other hand, the Poll contract can be inherited to expand functionality such as publishing of messages/commands, or the logic that allows users to register for the poll (AKA poll joining).

```javascript
function joinPoll(
  uint256 _nullifier,
  PublicKey calldata _publicKey,
  uint256 _stateRootIndex,
  uint256[8] calldata _proof,
  bytes memory _signUpPolicyData,
  bytes memory _initialVoiceCreditProxyData
) external virtual isWithinVotingDeadline {
  // Whether the user has already joined
  if (pollNullifiers[_nullifier]) {
    revert UserAlreadyJoined();
  }

  // Set nullifier for user's private key
  pollNullifiers[_nullifier] = true;

  // Verify user's proof
  if (!verifyJoiningPollProof(_nullifier, _stateRootIndex, _publicKey, _proof)) {
    revert InvalidPollProof();
  }

  // Check if the user is eligible to join the poll
  extContracts.policy.enforce(msg.sender, _signUpPolicyData);

  // Get the user's voice credit balance.
  uint256 voiceCreditBalance = extContracts.initialVoiceCreditProxy.getVoiceCredits(
    msg.sender,
    _initialVoiceCreditProxyData
  );

  // Store user in the pollStateTree
  uint256 stateLeaf = hashStateLeaf(StateLeaf(_publicKey, voiceCreditBalance, block.timestamp));

  uint256 stateRoot = InternalLazyIMT._insert(pollStateTree, stateLeaf);

  // Store the current state tree root in the array
  pollStateRootsOnJoin.push(stateRoot);

  uint256 pollStateIndex = pollStateTree.numberOfLeaves - 1;
  emit PollJoined(_publicKey.x, _publicKey.y, voiceCreditBalance, block.timestamp, _nullifier, pollStateIndex);
}
```

## Tally Contract

Given the verification functions being exposed by the Tally contract, quadratic funding protocols might require to extend the Tally contract to add distribution logic. Looking at this [example](https://github.com/ctrlc03/minimalQF/blob/main/contracts/MinimalQFTally.sol#L114) the `claimFunds` function is added to a contract inheriting from `Tally`, and uses functions such as `verifyPerVOSpentVoiceCredits` to distribute funds to projects part of a quadratic funding round.

## SDK

Another important component of MACI is the [SDK](https://github.com/privacy-scaling-explorations/maci/tree/dev/packages/sdk). This is a TypeScript library that allows you to interact with MACI.

You can find the following subdirectories, where functions are organised as follows:

- `deploy` - For deployment related code
- `keys` - For utilities related to MACI keys
- `maci` - For functions that allow to interact with the MACI contract, such as user signup
- `poll` - For functions that allow to interact with the Poll contract, such as poll joining
- `proof` - For functions related to proof generation, and submission on chain
- `relayer` - For functions that allow to interact with the relayer service
- `tally` - For functions that allow to interact with the Tally contract
- `trees` - Utility functions to interact with MACI's merkle trees structures
- `user` - Function related to user activities such as sign up and poll joining
- `utils` - Various utility functions that are used across the SDK and more
- `vote` - Functions that allow to create MACI encrypted votes and submit them on chain

You should find all you need to integrate MACI into your application inside this package. If anything is missing, feel free to open an issue on our repo.
