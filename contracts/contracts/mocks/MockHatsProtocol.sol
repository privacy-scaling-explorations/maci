// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { IHats } from "../interfaces/IHats.sol";

/// @title MockHatsProtocol
/// @notice A mock contract to test the HatsGatekeeper
contract MockHatsProtocol is IHats {
  IHats public immutable hats;

  uint256 public lastTopHat;
  uint256 public lastHat;

  /// @notice Deploy an instance of MockHatsProtocol
  /// @param _hats The Hats Protocol contract
  constructor(address _hats) payable {
    hats = IHats(_hats);
  }

  /// @inheritdoc IHats
  function mintTopHat(address _target, string calldata _details, string calldata _imageURI) external returns (uint256) {
    lastTopHat = hats.mintTopHat(_target, _details, _imageURI);
    return lastTopHat;
  }

  /// @inheritdoc IHats
  function createHat(
    uint256 _admin,
    string calldata _details,
    uint32 _maxSupply,
    address _eligibility,
    address _toggle,
    bool _mutable,
    string calldata _imageURI
  ) external returns (uint256) {
    lastHat = hats.createHat(_admin, _details, _maxSupply, _eligibility, _toggle, _mutable, _imageURI);
    return lastHat;
  }

  /// @inheritdoc IHats
  function mintHat(uint256 _hatId, address _wearer) external returns (bool) {
    return hats.mintHat(_hatId, _wearer);
  }

  /// @inheritdoc IHats
  function isWearerOfHat(address account, uint256 hat) external view override returns (bool) {
    return hats.isWearerOfHat(account, hat);
  }
}
