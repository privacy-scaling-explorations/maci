// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { IVerifyingKeysRegistry } from "./interfaces/IVerifyingKeysRegistry.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";

/// @title VerifyingKeysRegistry
/// @notice Stores verifying keys for the circuits.
/// Each circuit has a signature which is its compile-time constants represented
/// as a uint256.
contract VerifyingKeysRegistry is Ownable, DomainObjs, SnarkCommon, IVerifyingKeysRegistry {
  mapping(Mode => mapping(uint256 => VerifyingKey)) internal processVerifyingKeys;
  mapping(Mode => mapping(uint256 => bool)) internal processVerifyingKeysSet;

  mapping(Mode => mapping(uint256 => VerifyingKey)) internal tallyVerifyingKeys;
  mapping(Mode => mapping(uint256 => bool)) internal tallyVerifyingKeysSet;

  mapping(uint256 => VerifyingKey) internal pollJoiningVerifyingKeys;
  mapping(uint256 => bool) internal pollJoiningVerifyingKeysSet;

  mapping(uint256 => VerifyingKey) internal pollJoinedVerifyingKeys;
  mapping(uint256 => bool) internal pollJoinedVerifyingKeysSet;

  event PollJoiningVerifyingKeySet(uint256 _signature);
  event PollJoinedVerifyingKeySet(uint256 _signature);
  event ProcessVerifyingKeySet(uint256 _signature, Mode _mode);
  event TallyVerifyingKeySet(uint256 _signature, Mode _mode);

  error VerifyingKeyAlreadySet();
  error VerifyingKeyNotSet();
  error InvalidKeysParams();

  /// @notice Create a new instance of the VerifyingKeysRegistry contract
  // solhint-disable-next-line no-empty-blocks
  constructor(address _initialOwner) payable Ownable(_initialOwner) {}

  /// @notice Check if the poll joining verifying key is set
  /// @param _signature The signature
  /// @return isSet whether the verifying key is set
  function isPollJoiningVerifyingKeySet(uint256 _signature) public view returns (bool isSet) {
    isSet = pollJoiningVerifyingKeysSet[_signature];
  }

  /// @notice Check if the poll joined verifying key is set
  /// @param _signature The signature
  /// @return isSet whether the verifying key is set
  function isPollJoinedVerifyingKeySet(uint256 _signature) public view returns (bool isSet) {
    isSet = pollJoinedVerifyingKeysSet[_signature];
  }

  /// @notice Check if the process verifying key is set
  /// @param _signature The signature
  /// @param _mode QV, Non-QV, Full
  /// @return isSet whether the verifying key is set
  function isProcessVerifyingKeySet(uint256 _signature, Mode _mode) public view returns (bool isSet) {
    isSet = processVerifyingKeysSet[_mode][_signature];
  }

  /// @notice Check if the tally verifying key is set
  /// @param _signature The signature
  /// @param _mode QV, Non-QV, Full
  /// @return isSet whether the verifying key is set
  function isTallyVerifyingKeySet(uint256 _signature, Mode _mode) public view returns (bool isSet) {
    isSet = tallyVerifyingKeysSet[_mode][_signature];
  }

  /// @notice generate the signature for the poll joining verifying key
  /// @param _stateTreeDepth The state tree depth
  function generatePollJoiningVerifyingKeySignature(uint256 _stateTreeDepth) public pure returns (uint256 signature) {
    signature = (_stateTreeDepth << 64);
  }

  /// @notice generate the signature for the poll joined verifying key
  /// @param _stateTreeDepth The state tree depth
  function generatePollJoinedVerifyingKeySignature(uint256 _stateTreeDepth) public pure returns (uint256 signature) {
    signature = (_stateTreeDepth << 128);
  }

  /// @notice generate the signature for the process verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  function generateProcessVerifyingKeySignature(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize
  ) public pure returns (uint256 signature) {
    signature = (_messageBatchSize << 128) + (_stateTreeDepth << 64) + _voteOptionTreeDepth;
  }

  /// @notice generate the signature for the tally verifying key
  /// @param _stateTreeDepth The state tree depth
  /// @param _intStateTreeDepth The intermediate state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @return signature The signature
  function generateTallyVerifyingKeySignature(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth
  ) public pure returns (uint256 signature) {
    signature = (_stateTreeDepth << 128) + (_intStateTreeDepth << 64) + _voteOptionTreeDepth;
  }

  /// @notice Set the process and tally verifying keys for a certain combination
  /// of parameters and modes
  /// @param _args The verifying keys arguments
  function setVerifyingKeysBatch(SetVerifyingKeysBatchArgs calldata _args) public onlyOwner {
    if (
      _args.modes.length != _args.processVerifyingKeys.length || _args.modes.length != _args.tallyVerifyingKeys.length
    ) {
      revert InvalidKeysParams();
    }

    uint256 length = _args.modes.length;

    setPollJoiningVerifyingKey(_args.pollStateTreeDepth, _args.pollJoiningVerifyingKey);
    setPollJoinedVerifyingKey(_args.pollStateTreeDepth, _args.pollJoinedVerifyingKey);

    for (uint256 index = 0; index < length; ) {
      setVerifyingKeys(
        _args.stateTreeDepth,
        _args.tallyProcessingStateTreeDepth,
        _args.voteOptionTreeDepth,
        _args.messageBatchSize,
        _args.modes[index],
        _args.processVerifyingKeys[index],
        _args.tallyVerifyingKeys[index]
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
  /// @param _mode QV, Non-QV, Full
  /// @param _processVerifyingKey The process verifying key
  /// @param _tallyVerifyingKey The tally verifying key
  function setVerifyingKeys(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize,
    Mode _mode,
    VerifyingKey calldata _processVerifyingKey,
    VerifyingKey calldata _tallyVerifyingKey
  ) public onlyOwner {
    setProcessVerifyingKey(_stateTreeDepth, _voteOptionTreeDepth, _messageBatchSize, _mode, _processVerifyingKey);
    setTallyVerifyingKey(_stateTreeDepth, _intStateTreeDepth, _voteOptionTreeDepth, _mode, _tallyVerifyingKey);
  }

  /// @notice Set the process verifying key for a certain combination of parameters
  /// @param _stateTreeDepth The state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  /// @param _mode QV, Non-QV, Full
  /// @param _processVerifyingKey The process verifying key
  function setProcessVerifyingKey(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize,
    Mode _mode,
    VerifyingKey calldata _processVerifyingKey
  ) public onlyOwner {
    uint256 processVerifyingKeySignature = generateProcessVerifyingKeySignature(
      _stateTreeDepth,
      _voteOptionTreeDepth,
      _messageBatchSize
    );

    if (processVerifyingKeysSet[_mode][processVerifyingKeySignature]) {
      revert VerifyingKeyAlreadySet();
    }

    VerifyingKey storage processVerifyingKey = processVerifyingKeys[_mode][processVerifyingKeySignature];
    processVerifyingKey.alpha1 = _processVerifyingKey.alpha1;
    processVerifyingKey.beta2 = _processVerifyingKey.beta2;
    processVerifyingKey.gamma2 = _processVerifyingKey.gamma2;
    processVerifyingKey.delta2 = _processVerifyingKey.delta2;

    uint256 processIcLength = _processVerifyingKey.ic.length;
    for (uint256 i = 0; i < processIcLength; ) {
      processVerifyingKey.ic.push(_processVerifyingKey.ic[i]);

      unchecked {
        i++;
      }
    }

    processVerifyingKeysSet[_mode][processVerifyingKeySignature] = true;

    emit ProcessVerifyingKeySet(processVerifyingKeySignature, _mode);
  }

  /// @notice Set the tally verifying key for a certain combination of parameters
  /// @param _stateTreeDepth The state tree depth
  /// @param _intStateTreeDepth The intermediate state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _mode QV, Non-QV, Full
  /// @param _tallyVerifyingKey The tally verifying key
  function setTallyVerifyingKey(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth,
    Mode _mode,
    VerifyingKey calldata _tallyVerifyingKey
  ) public onlyOwner {
    uint256 tallyVerifyingKeySignature = generateTallyVerifyingKeySignature(
      _stateTreeDepth,
      _intStateTreeDepth,
      _voteOptionTreeDepth
    );

    if (tallyVerifyingKeysSet[_mode][tallyVerifyingKeySignature]) {
      revert VerifyingKeyAlreadySet();
    }

    VerifyingKey storage tallyVerifyingKey = tallyVerifyingKeys[_mode][tallyVerifyingKeySignature];
    tallyVerifyingKey.alpha1 = _tallyVerifyingKey.alpha1;
    tallyVerifyingKey.beta2 = _tallyVerifyingKey.beta2;
    tallyVerifyingKey.gamma2 = _tallyVerifyingKey.gamma2;
    tallyVerifyingKey.delta2 = _tallyVerifyingKey.delta2;

    uint256 tallyIcLength = _tallyVerifyingKey.ic.length;
    for (uint256 i = 0; i < tallyIcLength; ) {
      tallyVerifyingKey.ic.push(_tallyVerifyingKey.ic[i]);

      unchecked {
        i++;
      }
    }

    tallyVerifyingKeysSet[_mode][tallyVerifyingKeySignature] = true;

    emit TallyVerifyingKeySet(tallyVerifyingKeySignature, _mode);
  }

  /// @notice Set the poll joining verifying key for a certain combination of parameters
  /// @param _stateTreeDepth The state tree depth
  /// @param _pollJoiningVerifyingKey The poll joining verifying key
  function setPollJoiningVerifyingKey(
    uint256 _stateTreeDepth,
    VerifyingKey calldata _pollJoiningVerifyingKey
  ) public onlyOwner {
    uint256 pollJoiningVerifyingKeySignature = generatePollJoiningVerifyingKeySignature(_stateTreeDepth);

    if (pollJoiningVerifyingKeysSet[pollJoiningVerifyingKeySignature]) {
      revert VerifyingKeyAlreadySet();
    }

    VerifyingKey storage pollJoiningVerifyingKey = pollJoiningVerifyingKeys[pollJoiningVerifyingKeySignature];
    pollJoiningVerifyingKey.alpha1 = _pollJoiningVerifyingKey.alpha1;
    pollJoiningVerifyingKey.beta2 = _pollJoiningVerifyingKey.beta2;
    pollJoiningVerifyingKey.gamma2 = _pollJoiningVerifyingKey.gamma2;
    pollJoiningVerifyingKey.delta2 = _pollJoiningVerifyingKey.delta2;

    uint256 pollIcLength = _pollJoiningVerifyingKey.ic.length;
    for (uint256 i = 0; i < pollIcLength; ) {
      pollJoiningVerifyingKey.ic.push(_pollJoiningVerifyingKey.ic[i]);

      unchecked {
        i++;
      }
    }

    pollJoiningVerifyingKeysSet[pollJoiningVerifyingKeySignature] = true;

    emit PollJoiningVerifyingKeySet(pollJoiningVerifyingKeySignature);
  }

  /// @notice Set the poll joined verifying key for a certain combination of parameters
  /// @param _stateTreeDepth The state tree depth
  /// @param _pollJoinedVerifyingSignature The poll joined verifying key
  function setPollJoinedVerifyingKey(
    uint256 _stateTreeDepth,
    VerifyingKey calldata _pollJoinedVerifyingSignature
  ) public onlyOwner {
    uint256 pollJoinedVerifyingKeySignature = generatePollJoinedVerifyingKeySignature(_stateTreeDepth);

    if (pollJoinedVerifyingKeysSet[pollJoinedVerifyingKeySignature]) {
      revert VerifyingKeyAlreadySet();
    }

    VerifyingKey storage pollJoinedVerifyingKey = pollJoinedVerifyingKeys[pollJoinedVerifyingKeySignature];
    pollJoinedVerifyingKey.alpha1 = _pollJoinedVerifyingSignature.alpha1;
    pollJoinedVerifyingKey.beta2 = _pollJoinedVerifyingSignature.beta2;
    pollJoinedVerifyingKey.gamma2 = _pollJoinedVerifyingSignature.gamma2;
    pollJoinedVerifyingKey.delta2 = _pollJoinedVerifyingSignature.delta2;

    uint256 pollIcLength = _pollJoinedVerifyingSignature.ic.length;
    for (uint256 i = 0; i < pollIcLength; ) {
      pollJoinedVerifyingKey.ic.push(_pollJoinedVerifyingSignature.ic[i]);

      unchecked {
        i++;
      }
    }

    pollJoinedVerifyingKeysSet[pollJoinedVerifyingKeySignature] = true;

    emit PollJoinedVerifyingKeySet(pollJoinedVerifyingKeySignature);
  }

  /// @notice Check if the process verifying key is set
  /// @param _stateTreeDepth The state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _messageBatchSize The message batch size
  /// @param _mode QV, Non-QV, Full
  /// @return isSet whether the verifying key is set
  function hasProcessVerifyingKey(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize,
    Mode _mode
  ) public view returns (bool isSet) {
    uint256 signature = generateProcessVerifyingKeySignature(_stateTreeDepth, _voteOptionTreeDepth, _messageBatchSize);
    isSet = processVerifyingKeysSet[_mode][signature];
  }

  /// @notice Get the process verifying key by signature
  /// @param _signature The signature
  /// @param _mode QV, Non-QV, Full
  /// @return verifyingKey The verifying key
  function getProcessVerifyingKeyBySignature(
    uint256 _signature,
    Mode _mode
  ) public view returns (VerifyingKey memory verifyingKey) {
    if (!processVerifyingKeysSet[_mode][_signature]) {
      revert VerifyingKeyNotSet();
    }

    verifyingKey = processVerifyingKeys[_mode][_signature];
  }

  /// @inheritdoc IVerifyingKeysRegistry
  function getProcessVerifyingKey(
    uint256 _stateTreeDepth,
    uint256 _voteOptionTreeDepth,
    uint8 _messageBatchSize,
    Mode _mode
  ) public view returns (VerifyingKey memory verifyingKey) {
    uint256 signature = generateProcessVerifyingKeySignature(_stateTreeDepth, _voteOptionTreeDepth, _messageBatchSize);

    verifyingKey = getProcessVerifyingKeyBySignature(signature, _mode);
  }

  /// @notice Check if the tally verifying key is set
  /// @param _stateTreeDepth The state tree depth
  /// @param _intStateTreeDepth The intermediate state tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _mode QV, Non-QV, Full
  /// @return isSet whether the verifying key is set
  function hasTallyVerifyingKey(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth,
    Mode _mode
  ) public view returns (bool isSet) {
    uint256 signature = generateTallyVerifyingKeySignature(_stateTreeDepth, _intStateTreeDepth, _voteOptionTreeDepth);

    isSet = tallyVerifyingKeysSet[_mode][signature];
  }

  /// @notice Get the tally verifying key by signature
  /// @param _signature The signature
  /// @param _mode QV, Non-QV, Full
  /// @return verifyingKey The verifying key
  function getTallyVerifyingKeyBySignature(
    uint256 _signature,
    Mode _mode
  ) public view returns (VerifyingKey memory verifyingKey) {
    if (!tallyVerifyingKeysSet[_mode][_signature]) {
      revert VerifyingKeyNotSet();
    }

    verifyingKey = tallyVerifyingKeys[_mode][_signature];
  }

  /// @inheritdoc IVerifyingKeysRegistry
  function getTallyVerifyingKey(
    uint256 _stateTreeDepth,
    uint256 _intStateTreeDepth,
    uint256 _voteOptionTreeDepth,
    Mode _mode
  ) public view returns (VerifyingKey memory verifyingKey) {
    uint256 signature = generateTallyVerifyingKeySignature(_stateTreeDepth, _intStateTreeDepth, _voteOptionTreeDepth);

    verifyingKey = getTallyVerifyingKeyBySignature(signature, _mode);
  }

  /// @notice Get the poll joining verifying key by signature
  /// @param _signature The signature
  /// @return verifyingKey The verifying key
  function getPollJoiningVerifyingKeyBySignature(
    uint256 _signature
  ) public view returns (VerifyingKey memory verifyingKey) {
    if (!pollJoiningVerifyingKeysSet[_signature]) revert VerifyingKeyNotSet();

    verifyingKey = pollJoiningVerifyingKeys[_signature];
  }

  /// @notice Get the poll joined verifying key by signature
  /// @param _signature The signature
  /// @return verifyingKey The verifying key
  function getPollJoinedVerifyingKeyBySignature(
    uint256 _signature
  ) public view returns (VerifyingKey memory verifyingKey) {
    if (!pollJoinedVerifyingKeysSet[_signature]) revert VerifyingKeyNotSet();

    verifyingKey = pollJoinedVerifyingKeys[_signature];
  }

  /// @inheritdoc IVerifyingKeysRegistry
  function getPollJoiningVerifyingKey(uint256 _stateTreeDepth) public view returns (VerifyingKey memory verifyingKey) {
    uint256 signature = generatePollJoiningVerifyingKeySignature(_stateTreeDepth);

    verifyingKey = getPollJoiningVerifyingKeyBySignature(signature);
  }

  /// @inheritdoc IVerifyingKeysRegistry
  function getPollJoinedVerifyingKey(uint256 _stateTreeDepth) public view returns (VerifyingKey memory verifyingKey) {
    uint256 signature = generatePollJoinedVerifyingKeySignature(_stateTreeDepth);

    verifyingKey = getPollJoinedVerifyingKeyBySignature(signature);
  }
}
