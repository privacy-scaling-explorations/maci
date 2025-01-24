// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IVkRegistry } from "./interfaces/IVkRegistry.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";

/// @title VkRegistry
/// @notice Stores verifying keys for the circuits.
/// Each circuit has a signature which is its compile-time constants represented
/// as a uint256.
contract VkRegistry is Ownable(msg.sender), DomainObjs, SnarkCommon, IVkRegistry {
  mapping(Mode => mapping(uint256 => VerifyingKey)) internal processVks;
  mapping(Mode => mapping(uint256 => bool)) internal processVkSet;

  mapping(Mode => mapping(uint256 => VerifyingKey)) internal tallyVks;
  mapping(Mode => mapping(uint256 => bool)) internal tallyVkSet;

  mapping(uint256 => VerifyingKey) internal pollJoiningVks;
  mapping(uint256 => bool) internal pollJoiningVkSet;

  mapping(uint256 => VerifyingKey) internal pollJoinedVks;
  mapping(uint256 => bool) internal pollJoinedVkSet;

  event PollJoiningVkSet(uint256 _sig);
  event PollJoinedVkSet(uint256 _sig);
  event ProcessVkSet(uint256 _sig, Mode _mode);
  event TallyVkSet(uint256 _sig, Mode _mode);

  error VkAlreadySet();
  error VkNotSet();
  error InvalidKeysParams();

  /// @notice Create a new instance of the VkRegistry contract
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Check if the poll joining verifying key is set
  /// @param _sig The signature
  /// @return isSet whether the verifying key is set
  function isPollJoiningVkSet(uint256 _sig) public view returns (bool isSet) {
    isSet = pollJoiningVkSet[_sig];
  }

  /// @notice Check if the poll joined verifying key is set
  /// @param _sig The signature
  /// @return isSet whether the verifying key is set
  function isPollJoinedVkSet(uint256 _sig) public view returns (bool isSet) {
    isSet = pollJoinedVkSet[_sig];
  }

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

  /// @notice generate the signature for the poll joining verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  function genPollJoiningVkSig(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth
  ) public pure returns (uint256 sig) {
    sig = (_stateTreeDepth << 64) + _voteOptionTreeDepth;
  }

  /// @notice generate the signature for the poll joined verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  function genPollJoinedVkSig(uint256 _stateTreeDepth, uint256 _voteOptionTreeDepth) public pure returns (uint256 sig) {
    sig = (_stateTreeDepth << 128) + (_voteOptionTreeDepth << 64);
  }

  /// @notice generate the signature for the process verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  function genProcessVkSig(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize
  ) public pure returns (uint256 sig) {
    sig = (_messageBatchSize << 128) + (_stateTreeDepth << 64) + _voteOptionTreeDepth;
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
  /// of parameters and modes
  /// @param _stateTreeDepth The state tree depth
  /// @param _intStateTreeDepth The intermediate state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  /// @param _modes Array of QV or Non-QV modes (must have the same length as process and tally keys)
  /// @param _pollJoiningVk The poll joining verifying key
  /// @param _pollJoinedVk The poll joined verifying key
  /// @param _processVks The process verifying keys (must have the same length as modes)
  /// @param _tallyVks The tally verifying keys (must have the same length as modes)
  function setVerifyingKeysBatch(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize,
    Mode[] calldata _modes,
    VerifyingKey calldata _pollJoiningVk,
    VerifyingKey calldata _pollJoinedVk,
    VerifyingKey[] calldata _processVks,
    VerifyingKey[] calldata _tallyVks
  ) public onlyOwner {
    if (_modes.length != _processVks.length || _modes.length != _tallyVks.length) {
      revert InvalidKeysParams();
    }

    uint256 length = _modes.length;

    setPollJoiningVkKey(_stateTreeDepth, _voteOptionTreeDepth, _pollJoiningVk);
    setPollJoinedVkKey(_stateTreeDepth, _voteOptionTreeDepth, _pollJoinedVk);

    for (uint256 index = 0; index < length; ) {
      setVerifyingKeys(
        _stateTreeDepth,
        _intStateTreeDepth,
        _voteOptionTreeDepth,
        _messageBatchSize,
        _modes[index],
        _processVks[index],
        _tallyVks[index]
      );

      unchecked {
        index++;
      }
    }
  }

  /// @notice Set the process and tally verifying keys for a certain combination
  /// @param _stateTreeDepth The state tree depth
  /// @param _intStateTreeDepth The intermediate state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  /// @param _mode QV or Non-QV
  /// @param _processVk The process verifying key
  /// @param _tallyVk The tally verifying key
  function setVerifyingKeys(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize,
    Mode _mode,
    VerifyingKey calldata _processVk,
    VerifyingKey calldata _tallyVk
  ) public onlyOwner {
    setProcessVkKey(_stateTreeDepth, _voteOptionTreeDepth, _messageBatchSize, _mode, _processVk);
    setTallyVkKey(_stateTreeDepth, _intStateTreeDepth, _voteOptionTreeDepth, _mode, _tallyVk);
  }

  /// @notice Set the process verifying key for a certain combination of parameters
  /// @param _stateTreeDepth The state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  /// @param _mode QV or Non-QV
  /// @param _processVk The process verifying key
  function setProcessVkKey(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize,
    Mode _mode,
    VerifyingKey calldata _processVk
  ) public onlyOwner {
    uint256 processVkSig = genProcessVkSig(_stateTreeDepth, _voteOptionTreeDepth, _messageBatchSize);

    if (processVkSet[_mode][processVkSig]) revert VkAlreadySet();

    VerifyingKey storage processVk = processVks[_mode][processVkSig];
    processVk.alpha1 = _processVk.alpha1;
    processVk.beta2 = _processVk.beta2;
    processVk.gamma2 = _processVk.gamma2;
    processVk.delta2 = _processVk.delta2;

    uint256 processIcLength = _processVk.ic.length;
    for (uint256 i = 0; i < processIcLength; ) {
      processVk.ic.push(_processVk.ic[i]);

      unchecked {
        i++;
      }
    }

    processVkSet[_mode][processVkSig] = true;

    emit ProcessVkSet(processVkSig, _mode);
  }

  /// @notice Set the tally verifying key for a certain combination of parameters
  /// @param _stateTreeDepth The state tree depth
  /// @param _intStateTreeDepth The intermediate state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _mode QV or Non-QV
  /// @param _tallyVk The tally verifying key
  function setTallyVkKey(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth,
    Mode _mode,
    VerifyingKey calldata _tallyVk
  ) public onlyOwner {
    uint256 tallyVkSig = genTallyVkSig(_stateTreeDepth, _intStateTreeDepth, _voteOptionTreeDepth);

    if (tallyVkSet[_mode][tallyVkSig]) revert VkAlreadySet();

    VerifyingKey storage tallyVk = tallyVks[_mode][tallyVkSig];
    tallyVk.alpha1 = _tallyVk.alpha1;
    tallyVk.beta2 = _tallyVk.beta2;
    tallyVk.gamma2 = _tallyVk.gamma2;
    tallyVk.delta2 = _tallyVk.delta2;

    uint256 tallyIcLength = _tallyVk.ic.length;
    for (uint256 i = 0; i < tallyIcLength; ) {
      tallyVk.ic.push(_tallyVk.ic[i]);

      unchecked {
        i++;
      }
    }

    tallyVkSet[_mode][tallyVkSig] = true;

    emit TallyVkSet(tallyVkSig, _mode);
  }

  /// @notice Set the poll joining verifying key for a certain combination of parameters
  /// @param _stateTreeDepth The state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _pollJoiningVk The poll joining verifying key
  function setPollJoiningVkKey(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth,
    VerifyingKey calldata _pollJoiningVk
  ) public onlyOwner {
    uint256 pollJoiningVkSig = genPollJoiningVkSig(_stateTreeDepth, _voteOptionTreeDepth);

    if (pollJoiningVkSet[pollJoiningVkSig]) revert VkAlreadySet();

    VerifyingKey storage pollJoiningVk = pollJoiningVks[pollJoiningVkSig];
    pollJoiningVk.alpha1 = _pollJoiningVk.alpha1;
    pollJoiningVk.beta2 = _pollJoiningVk.beta2;
    pollJoiningVk.gamma2 = _pollJoiningVk.gamma2;
    pollJoiningVk.delta2 = _pollJoiningVk.delta2;

    uint256 pollIcLength = _pollJoiningVk.ic.length;
    for (uint256 i = 0; i < pollIcLength; ) {
      pollJoiningVk.ic.push(_pollJoiningVk.ic[i]);

      unchecked {
        i++;
      }
    }

    pollJoiningVkSet[pollJoiningVkSig] = true;

    emit PollJoiningVkSet(pollJoiningVkSig);
  }

  /// @notice Set the poll joined verifying key for a certain combination of parameters
  /// @param _stateTreeDepth The state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _pollJoinedVk The poll joined verifying key
  function setPollJoinedVkKey(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth,
    VerifyingKey calldata _pollJoinedVk
  ) public onlyOwner {
    uint256 pollJoinedVkSig = genPollJoinedVkSig(_stateTreeDepth, _voteOptionTreeDepth);

    if (pollJoinedVkSet[pollJoinedVkSig]) revert VkAlreadySet();

    VerifyingKey storage pollJoinedVk = pollJoinedVks[pollJoinedVkSig];
    pollJoinedVk.alpha1 = _pollJoinedVk.alpha1;
    pollJoinedVk.beta2 = _pollJoinedVk.beta2;
    pollJoinedVk.gamma2 = _pollJoinedVk.gamma2;
    pollJoinedVk.delta2 = _pollJoinedVk.delta2;

    uint256 pollIcLength = _pollJoinedVk.ic.length;
    for (uint256 i = 0; i < pollIcLength; ) {
      pollJoinedVk.ic.push(_pollJoinedVk.ic[i]);

      unchecked {
        i++;
      }
    }

    pollJoinedVkSet[pollJoinedVkSig] = true;

    emit PollJoinedVkSet(pollJoinedVkSig);
  }

  /// @notice Check if the process verifying key is set
  /// @param _stateTreeDepth The state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  /// @param _mode QV or Non-QV
  /// @return isSet whether the verifying key is set
  function hasProcessVk(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize,
    Mode _mode
  ) public view returns (bool isSet) {
    uint256 sig = genProcessVkSig(_stateTreeDepth, _voteOptionTreeDepth, _messageBatchSize);
    isSet = processVkSet[_mode][sig];
  }

  /// @notice Get the process verifying key by signature
  /// @param _sig The signature
  /// @param _mode QV or Non-QV
  /// @return vk The verifying key
  function getProcessVkBySig(uint256 _sig, Mode _mode) public view returns (VerifyingKey memory vk) {
    if (!processVkSet[_mode][_sig]) revert VkNotSet();

    vk = processVks[_mode][_sig];
  }

  /// @inheritdoc IVkRegistry
  function getProcessVk(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize,
    Mode _mode
  ) public view returns (VerifyingKey memory vk) {
    uint256 sig = genProcessVkSig(_stateTreeDepth, _voteOptionTreeDepth, _messageBatchSize);

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
    if (!tallyVkSet[_mode][_sig]) revert VkNotSet();

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

  /// @notice Get the poll joining verifying key by signature
  /// @param _sig The signature
  /// @return vk The verifying key
  function getPollJoiningVkBySig(uint256 _sig) public view returns (VerifyingKey memory vk) {
    if (!pollJoiningVkSet[_sig]) revert VkNotSet();

    vk = pollJoiningVks[_sig];
  }

  /// @notice Get the poll joined verifying key by signature
  /// @param _sig The signature
  /// @return vk The verifying key
  function getPollJoinedVkBySig(uint256 _sig) public view returns (VerifyingKey memory vk) {
    if (!pollJoinedVkSet[_sig]) revert VkNotSet();

    vk = pollJoinedVks[_sig];
  }

  /// @inheritdoc IVkRegistry
  function getPollJoiningVk(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth
  ) public view returns (VerifyingKey memory vk) {
    uint256 sig = genPollJoiningVkSig(_stateTreeDepth, _voteOptionTreeDepth);

    vk = getPollJoiningVkBySig(sig);
  }

  /// @inheritdoc IVkRegistry
  function getPollJoinedVk(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth
  ) public view returns (VerifyingKey memory vk) {
    uint256 sig = genPollJoinedVkSig(_stateTreeDepth, _voteOptionTreeDepth);

    vk = getPollJoinedVkBySig(sig);
  }
}
