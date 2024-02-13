// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @title IHats
/// @notice The interface for the Hats Protocol contract
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
}

/// @title MockHatsProtocol
/// @notice A mock contract to test the HatsGatekeeper
contract MockHatsProtocol {
  IHats public immutable hats;

  uint256 public lastTopHat;
  uint256 public lastHat;

  /// @notice Deploy an instance of MockHatsProtocol
  /// @param _hats The Hats Protocol contract
  constructor(address _hats) payable {
    hats = IHats(_hats);
  }

  /// @notice Creates and mints a Hat that is its own admin, i.e. a "topHat"
  /// @dev A topHat has no eligibility and no toggle
  /// @param _target The address to which the newly created topHat is minted
  /// @param _details A description of the Hat [optional]. Should not be larger than 7000 bytes
  ///                 (enforced in changeHatDetails)
  /// @param _imageURI The image uri for this top hat and the fallback for its
  ///                  downstream hats [optional]. Should not be large than 7000 bytes
  ///                  (enforced in changeHatImageURI)
  function mintTopHat(address _target, string calldata _details, string calldata _imageURI) external {
    lastTopHat = hats.mintTopHat(_target, _details, _imageURI);
  }

  /// @notice Creates a new hat. The msg.sender must wear the `_admin` hat.
  /// @dev Initializes a new Hat struct, but does not mint any tokens.
  /// @param _details A description of the Hat. Should not be larger than 7000 bytes (enforced in changeHatDetails)
  /// @param _maxSupply The total instances of the Hat that can be worn at once
  /// @param _admin The id of the Hat that will control who wears the newly created hat
  /// @param _eligibility The address that can report on the Hat wearer's status
  /// @param _toggle The address that can deactivate the Hat
  /// @param _mutable Whether the hat's properties are changeable after creation
  /// @param _imageURI The image uri for this hat and the fallback for its
  ///                  downstream hats [optional]. Should not be larger than 7000 bytes (enforced in changeHatImageURI)
  function createHat(
    uint256 _admin,
    string calldata _details,
    uint32 _maxSupply,
    address _eligibility,
    address _toggle,
    bool _mutable,
    string calldata _imageURI
  ) external {
    lastHat = hats.createHat(_admin, _details, _maxSupply, _eligibility, _toggle, _mutable, _imageURI);
  }

  /// @notice Mints a hat to the specified wearer
  /// @param _hatId The id of the hat to mint
  /// @param _wearer The address of the wearer
  function mintHat(uint256 _hatId, address _wearer) external {
    hats.mintHat(_hatId, _wearer);
  }
}
