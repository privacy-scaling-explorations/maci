// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { IMACI } from "./interfaces/IMACI.sol";
import { MessageProcessor } from "./MessageProcessor.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Poll } from "./Poll.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { Hasher } from "./crypto/Hasher.sol";
import { CommonUtilities } from "./utilities/Utilities.sol";
import { Verifier } from "./crypto/Verifier.sol";
import { VkRegistry } from "./VkRegistry.sol";

/// @title Subsidy
/// @notice This contract is used to verify that the subsidy calculations
/// are correct. It is also used to update the subsidy commitment if the
/// proof is valid.
contract Subsidy is Ownable, CommonUtilities, Hasher, SnarkCommon {
  // row batch index
  uint256 public rbi;
  // column batch index
  uint256 public cbi;

  // The final commitment to the state and ballot roots
  uint256 public sbCommitment;
  uint256 public subsidyCommitment;

  uint8 internal constant TREE_ARITY = 5;

  // Error codes
  error ProcessingNotComplete();
  error InvalidSubsidyProof();
  error AllSubsidyCalculated();
  error VkNotSet();
  error NumSignUpsTooLarge();
  error RbiTooLarge();
  error CbiTooLarge();

  Verifier public verifier;
  VkRegistry public vkRegistry;

  /// @notice Create a new Subsidy contract
  /// @param _verifier The Verifier contract
  /// @param _vkRegistry The VkRegistry contract
  constructor(Verifier _verifier, VkRegistry _vkRegistry) payable {
    verifier = _verifier;
    vkRegistry = _vkRegistry;
  }

  /// @notice Update the currentSbCommitment if the proof is valid.
  /// @dev currentSbCommitment is the commitment to the state and ballot roots
  /// @param _mp The MessageProcessor contract
  function updateSbCommitment(MessageProcessor _mp) public onlyOwner {
    // Require that all messages have been processed
    if (!_mp.processingComplete()) {
      revert ProcessingNotComplete();
    }
    if (sbCommitment == 0) {
      sbCommitment = _mp.sbCommitment();
    }
  }

  /// @notice Generate the packed values for the subsidy proof
  /// @param _numSignUps The number of signups
  /// @return result The packed values
  function genSubsidyPackedVals(uint256 _numSignUps) public view returns (uint256 result) {
    if (_numSignUps >= 2 ** 50) revert NumSignUpsTooLarge();
    if (rbi >= 2 ** 50) revert RbiTooLarge();
    if (cbi >= 2 ** 50) revert CbiTooLarge();
    result = (_numSignUps << 100) + (rbi << 50) + cbi;
  }

  /// @notice Generate the public input hash for the subsidy proof
  /// @param _numSignUps The number of signups
  /// @param _newSubsidyCommitment The new subsidy commitment
  /// @return inputHash The public input hash
  function genSubsidyPublicInputHash(
    uint256 _numSignUps,
    uint256 _newSubsidyCommitment
  ) public view returns (uint256 inputHash) {
    uint256 packedVals = genSubsidyPackedVals(_numSignUps);
    uint256[] memory input = new uint256[](4);
    input[0] = packedVals;
    input[1] = sbCommitment;
    input[2] = subsidyCommitment;
    input[3] = _newSubsidyCommitment;
    inputHash = sha256Hash(input);
  }

  /// @notice Update the subsidy commitment if the proof is valid
  /// @param _poll The Poll contract
  /// @param _mp The MessageProcessor contract
  /// @param _newSubsidyCommitment The new subsidy commitment
  /// @param _proof The proof
  function updateSubsidy(
    Poll _poll,
    MessageProcessor _mp,
    uint256 _newSubsidyCommitment,
    uint256[8] calldata _proof
  ) external onlyOwner {
    _votingPeriodOver(_poll);
    updateSbCommitment(_mp);

    (uint8 intStateTreeDepth, , , ) = _poll.treeDepths();

    uint256 subsidyBatchSize = uint256(TREE_ARITY) ** intStateTreeDepth;

    (uint256 numSignUps, ) = _poll.numSignUpsAndMessages();

    // Require that there are unfinished ballots left
    if (rbi * subsidyBatchSize > numSignUps) {
      revert AllSubsidyCalculated();
    }

    bool isValid = verifySubsidyProof(_poll, _proof, numSignUps, _newSubsidyCommitment);
    if (!isValid) {
      revert InvalidSubsidyProof();
    }
    subsidyCommitment = _newSubsidyCommitment;
    increaseSubsidyIndex(subsidyBatchSize, numSignUps);
  }

  /// @notice Increase the subsidy batch index (rbi, cbi) to next,
  /// it will try to cbi++ if the whole batch can fit into numLeaves
  /// otherwise it will increase row index: rbi++.
  /// Each batch for subsidy calculation is 2 dimensional: batchSize*batchSize
  /// @param batchSize the size of 1 dimensional batch over the signup users
  /// @param numLeaves total number of leaves in stateTree, i.e. number of signup users
  function increaseSubsidyIndex(uint256 batchSize, uint256 numLeaves) internal {
    if (cbi * batchSize + batchSize < numLeaves) {
      cbi++;
    } else {
      rbi++;
      cbi = rbi;
    }
  }

  /// @notice Verify the subsidy proof using the Groth16 on chain verifier
  /// @param _poll The Poll contract
  /// @param _proof The proof
  /// @param _numSignUps The number of signups
  /// @param _newSubsidyCommitment The new subsidy commitment
  /// @return isValid True if the proof is valid
  function verifySubsidyProof(
    Poll _poll,
    uint256[8] calldata _proof,
    uint256 _numSignUps,
    uint256 _newSubsidyCommitment
  ) public view returns (bool isValid) {
    (uint8 intStateTreeDepth, , , uint8 voteOptionTreeDepth) = _poll.treeDepths();
    (IMACI maci, , ) = _poll.extContracts();

    // Get the verifying key
    VerifyingKey memory vk = vkRegistry.getSubsidyVk(maci.stateTreeDepth(), intStateTreeDepth, voteOptionTreeDepth);

    // Get the public inputs
    uint256 publicInputHash = genSubsidyPublicInputHash(_numSignUps, _newSubsidyCommitment);

    // Verify the proof
    isValid = verifier.verify(_proof, vk, publicInputHash);
  }
}
