// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Params } from "../utilities/Params.sol";
import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title IMACI
/// @notice MACI interface
interface IMACI {
  /// @notice A struct holding the addresses of poll, mp and tally
  struct PollContracts {
    address poll;
    address messageProcessor;
    address tally;
  }
  /// @notice A struct holding the params for poll deployment
  struct DeployPollArgs {
    /// @param duration How long should the Poll last for
    uint256 duration;
    /// @param treeDepths The depth of the Merkle trees
    Params.TreeDepths treeDepths;
    /// @param messageBatchSize The message batch size
    uint8 messageBatchSize;
    /// @param coordinatorPubKey The coordinator's public key
    DomainObjs.PubKey coordinatorPubKey;
    /// @param verifier The Verifier Contract
    address verifier;
    /// @param vkRegistry The VkRegistry Contract
    address vkRegistry;
    /// @param mode Voting mode
    DomainObjs.Mode mode;
    /// @param gatekeeper The gatekeeper contract
    address gatekeeper;
    /// @param initialVoiceCreditProxy The initial voice credit proxy contract
    address initialVoiceCreditProxy;
    /// @param relayer The message relayer (optional)
    address[] relayers;
  }

  /// @notice Get the depth of the state tree
  /// @return The depth of the state tree
  function stateTreeDepth() external view returns (uint8);

  /// @notice Return the main root of the StateAq contract
  /// @return The Merkle root
  function getStateTreeRoot() external view returns (uint256);

  /// @notice Get the index of a public key in the state tree
  /// @param _pubKeyHash The hash of the public key
  /// @return index The index of the public key in the state tree
  function getStateIndex(uint256 _pubKeyHash) external view returns (uint256);

  /// @notice Deploy a new Poll contract.
  /// @param _pollArgs The deploy poll args
  function deployPoll(DeployPollArgs memory _pollArgs) external returns (PollContracts memory);

  /// @notice Allows any eligible user sign up. The sign-up gatekeeper should prevent
  /// double sign-ups or ineligible users from doing so.  This function will
  /// only succeed if the sign-up deadline has not passed.
  /// @param _pubKey The user's desired public key.
  /// @param _signUpGatekeeperData Data to pass to the sign-up gatekeeper's
  ///     register() function. For instance, the POAPGatekeeper or
  ///     SignUpTokenGatekeeper requires this value to be the ABI-encoded
  ///     token ID.
  function signUp(DomainObjs.PubKey memory _pubKey, bytes memory _signUpGatekeeperData) external;

  /// @notice Return the state root when the '_index' user signed up
  /// @param _index The serial number when the user signed up
  /// @return The Merkle root
  function getStateRootOnIndexedSignUp(uint256 _index) external view returns (uint256);

  /// @notice Get the number of signups
  /// @return numsignUps The number of signups
  function numSignUps() external view returns (uint256);
}
