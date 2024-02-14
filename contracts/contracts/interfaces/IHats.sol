// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @title IHats
/// @notice Minimal interface for the Hats Protocol contract
/// @dev Includes only the functions required for the HatsGatekeepers and associated tests
interface IHats {
  function mintTopHat(address _target, string calldata _details, string calldata _imageURI) external returns (uint256);

  function createHat(
    uint256 _admin,
    string calldata _details,
    uint32 _maxSupply,
    address _eligibility,
    address _toggle,
    bool _mutable,
    string calldata _imageURI
  ) external returns (uint256);

  function mintHat(uint256 _hatId, address _wearer) external returns (bool success);

  function isWearerOfHat(address account, uint256 hat) external view returns (bool);
}
