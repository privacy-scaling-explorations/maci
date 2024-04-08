// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IVkRegistry } from "./interfaces/IVkRegistry.sol";

/// @title VkRegistry
/// @notice Stores verifying keys for the circuits.
/// Each circuit has a signature which is its compile-time constants represented
/// as a uint256.
contract VkRegistry is Ownable, SnarkCommon, IVkRegistry {
  mapping(Mode => mapping(uint256 => VerifyingKey)) internal processVks;
  mapping(Mode => mapping(uint256 => bool)) internal processVkSet;

  mapping(Mode => mapping(uint256 => VerifyingKey)) internal tallyVks;
  mapping(Mode => mapping(uint256 => bool)) internal tallyVkSet;

  event ProcessVkSet(uint256 _sig, Mode mode);
  event TallyVkSet(uint256 _sig, Mode mode);

  error ProcessVkAlreadySet();
  error TallyVkAlreadySet();
  error ProcessVkNotSet();
  error TallyVkNotSet();
  error SubsidyVkNotSet();

  /// @notice Create a new instance of the VkRegistry contract
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Check if the process verifying key is set
  /// @param _sig The signature
  /// @param _mode QV or Non-QV
  /// @return isSet whether the verifying key is set
  function isProcessVkSet(uint256 _sig, Mode _mode) public view returns (bool isSet) {
    isSet = processVkSet[_mode][_sig];
  }

  /// @notice Check if the tally verifying key is set
  /// @param _sig The signature
  /// @param _mode QV or Non-QV
  /// @return isSet whether the verifying key is set
  function isTallyVkSet(uint256 _sig, Mode _mode) public view returns (bool isSet) {
    isSet = tallyVkSet[_mode][_sig];
  }

  /// @notice generate the signature for the process verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @param _messageTreeDepth The message tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  function genProcessVkSig(
    uint256 _stateTreeDepth,
    uint256 _messageTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint256 _messageBatchSize
  ) public pure returns (uint256 sig) {
    sig = (_messageBatchSize << 192) + (_stateTreeDepth << 128) + (_messageTreeDepth << 64) + _voteOptionTreeDepth;
  }

  /// @notice generate the signature for the tally verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @param _intStateTreeDepth The intermediate state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @return sig The signature
  function genTallyVkSig(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth
  ) public pure returns (uint256 sig) {
    sig = (_stateTreeDepth << 128) + (_intStateTreeDepth << 64) + _voteOptionTreeDepth;
  }

  /// @notice Set the process and tally verifying keys for a certain combination
  /// of parameters
  /// @param _stateTreeDepth The state tree depth
  /// @param _intStateTreeDepth The intermediate state tree depth
  /// @param _messageTreeDepth The message tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  /// @param _mode QV or Non-QV
  /// @param _processVk The process verifying key
  /// @param _tallyVk The tally verifying key
  function setVerifyingKeys(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _messageTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint256 _messageBatchSize,
    Mode _mode,
    VerifyingKey calldata _processVk,
    VerifyingKey calldata _tallyVk
  ) public onlyOwner {
    uint256 processVkSig = genProcessVkSig(_stateTreeDepth, _messageTreeDepth, _voteOptionTreeDepth, _messageBatchSize);

    if (processVkSet[_mode][processVkSig]) revert ProcessVkAlreadySet();

    uint256 tallyVkSig = genTallyVkSig(_stateTreeDepth, _intStateTreeDepth, _voteOptionTreeDepth);

    if (tallyVkSet[_mode][tallyVkSig]) revert TallyVkAlreadySet();

    VerifyingKey storage processVk = processVks[_mode][processVkSig];
    processVk.alpha1 = _processVk.alpha1;
    processVk.beta2 = _processVk.beta2;
    processVk.gamma2 = _processVk.gamma2;
    processVk.delta2 = _processVk.delta2;

    for (uint8 i = 0; i < _processVk.ic.length; i++) {
      processVk.ic.push(_processVk.ic[i]);
    }

    processVkSet[_mode][processVkSig] = true;

    VerifyingKey storage tallyVk = tallyVks[_mode][tallyVkSig];
    tallyVk.alpha1 = _tallyVk.alpha1;
    tallyVk.beta2 = _tallyVk.beta2;
    tallyVk.gamma2 = _tallyVk.gamma2;
    tallyVk.delta2 = _tallyVk.delta2;

    for (uint8 i = 0; i < _tallyVk.ic.length; i++) {
      tallyVk.ic.push(_tallyVk.ic[i]);
    }

    tallyVkSet[_mode][tallyVkSig] = true;

    emit TallyVkSet(tallyVkSig, _mode);
    emit ProcessVkSet(processVkSig, _mode);
  }

  /// @notice Check if the process verifying key is set
  /// @param _stateTreeDepth The state tree depth
  /// @param _messageTreeDepth The message tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  /// @param _mode QV or Non-QV
  /// @return isSet whether the verifying key is set
  function hasProcessVk(
    uint256 _stateTreeDepth,
    uint256 _messageTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint256 _messageBatchSize,
    Mode _mode
  ) public view returns (bool isSet) {
    uint256 sig = genProcessVkSig(_stateTreeDepth, _messageTreeDepth, _voteOptionTreeDepth, _messageBatchSize);
    isSet = processVkSet[_mode][sig];
  }

  /// @notice Get the process verifying key by signature
  /// @param _sig The signature
  /// @param _mode QV or Non-QV
  /// @return vk The verifying key
  function getProcessVkBySig(uint256 _sig, Mode _mode) public view returns (VerifyingKey memory vk) {
    if (!processVkSet[_mode][_sig]) revert ProcessVkNotSet();

    vk = processVks[_mode][_sig];
  }

  /// @inheritdoc IVkRegistry
  function getProcessVk(
    uint256 _stateTreeDepth,
    uint256 _messageTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint256 _messageBatchSize,
    Mode _mode
  ) public view returns (VerifyingKey memory vk) {
    uint256 sig = genProcessVkSig(_stateTreeDepth, _messageTreeDepth, _voteOptionTreeDepth, _messageBatchSize);

    vk = getProcessVkBySig(sig, _mode);
  }

  /// @notice Check if the tally verifying key is set
  /// @param _stateTreeDepth The state tree depth
  /// @param _intStateTreeDepth The intermediate state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _mode QV or Non-QV
  /// @return isSet whether the verifying key is set
  function hasTallyVk(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth,
    Mode _mode
  ) public view returns (bool isSet) {
    uint256 sig = genTallyVkSig(_stateTreeDepth, _intStateTreeDepth, _voteOptionTreeDepth);

    isSet = tallyVkSet[_mode][sig];
  }

  /// @notice Get the tally verifying key by signature
  /// @param _sig The signature
  /// @param _mode QV or Non-QV
  /// @return vk The verifying key
  function getTallyVkBySig(uint256 _sig, Mode _mode) public view returns (VerifyingKey memory vk) {
    if (!tallyVkSet[_mode][_sig]) revert TallyVkNotSet();

    vk = tallyVks[_mode][_sig];
  }

  /// @inheritdoc IVkRegistry
  function getTallyVk(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth,
    Mode _mode
  ) public view returns (VerifyingKey memory vk) {
    uint256 sig = genTallyVkSig(_stateTreeDepth, _intStateTreeDepth, _voteOptionTreeDepth);

    vk = getTallyVkBySig(sig, _mode);
  }
}
