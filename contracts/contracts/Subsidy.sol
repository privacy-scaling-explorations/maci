// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { IMACI } from "./interfaces/IMACI.sol";
import { IMessageProcessor } from "./interfaces/IMessageProcessor.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IPoll } from "./interfaces/IPoll.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { Hasher } from "./crypto/Hasher.sol";
import { CommonUtilities } from "./utilities/CommonUtilities.sol";
import { IVerifier } from "./interfaces/IVerifier.sol";
import { IVkRegistry } from "./interfaces/IVkRegistry.sol";

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

  uint256 private constant TREE_ARITY = 5;

  IVerifier public immutable verifier;
  IVkRegistry public immutable vkRegistry;
  IPoll public immutable poll;
  IMessageProcessor public immutable mp;

  // Custom errors
  error ProcessingNotComplete();
  error InvalidSubsidyProof();
  error AllSubsidyCalculated();
  error VkNotSet();
  error NumSignUpsTooLarge();
  error RbiTooLarge();
  error CbiTooLarge();

  /// @notice Create a new Subsidy contract
  /// @param _verifier The Verifier contract
  /// @param _vkRegistry The VkRegistry contract
  /// @param _poll The Poll contract
  /// @param _mp The MessageProcessor contract
  constructor(address _verifier, address _vkRegistry, address _poll, address _mp) payable {
    verifier = IVerifier(_verifier);
    vkRegistry = IVkRegistry(_vkRegistry);
    poll = IPoll(_poll);
    mp = IMessageProcessor(_mp);
  }

  /// @notice Update the currentSbCommitment if the proof is valid.
  /// @dev currentSbCommitment is the commitment to the state and ballot roots
  function updateSbCommitment() public onlyOwner {
    // Require that all messages have been processed
    if (!mp.processingComplete()) {
      revert ProcessingNotComplete();
    }

    // only update it once
    if (sbCommitment == 0) {
      sbCommitment = mp.sbCommitment();
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
  /// @param _newSubsidyCommitment The new subsidy commitment
  /// @param _proof The proof
  function updateSubsidy(uint256 _newSubsidyCommitment, uint256[8] calldata _proof) external onlyOwner {
    _votingPeriodOver(poll);
    updateSbCommitment();

    (uint8 intStateTreeDepth, , , ) = poll.treeDepths();

    uint256 subsidyBatchSize = TREE_ARITY ** intStateTreeDepth;

    (uint256 numSignUps, ) = poll.numSignUpsAndMessages();

    // Require that there are unfinished ballots left
    if (rbi * subsidyBatchSize > numSignUps) {
      revert AllSubsidyCalculated();
    }

    bool isValid = verifySubsidyProof(_proof, numSignUps, _newSubsidyCommitment);
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
  /// @param _proof The proof
  /// @param _numSignUps The number of signups
  /// @param _newSubsidyCommitment The new subsidy commitment
  /// @return isValid True if the proof is valid
  function verifySubsidyProof(
    uint256[8] calldata _proof,
    uint256 _numSignUps,
    uint256 _newSubsidyCommitment
  ) public view returns (bool isValid) {
    (uint8 intStateTreeDepth, , , uint8 voteOptionTreeDepth) = poll.treeDepths();
    (IMACI maci, , ) = poll.extContracts();

    // Get the verifying key
    VerifyingKey memory vk = vkRegistry.getSubsidyVk(maci.stateTreeDepth(), intStateTreeDepth, voteOptionTreeDepth);

    // Get the public inputs
    uint256 publicInputHash = genSubsidyPublicInputHash(_numSignUps, _newSubsidyCommitment);

    // Verify the proof
    isValid = verifier.verify(_proof, vk, publicInputHash);
  }
}
