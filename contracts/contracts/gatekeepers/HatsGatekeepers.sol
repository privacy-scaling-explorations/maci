// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";

interface IHats {
  function isWearerOfHat(address account, uint256 hat) external view returns (bool);
}

// custom errors
error OnlyMACI();
error NotWearingCriterionHat();
error NotCriterionHat();
error AlreadyRegistered();

contract HatsGatekeeperSingle is SignUpGatekeeper, Ownable {
  /// @notice The Hats Protocol contract address
  IHats public immutable hats;

  /// @notice The hat that users must wear to be eligible to register
  uint256 public immutable criterionHat;

  /// @notice the reference to the MACI contract
  address public maci;

  /// @notice Tracks registered users
  mapping(address => bool) public registered;

  /// @notice Deploy an instance of HatsGatekeeper
  /// @param _hats The Hats Protocol contract
  /// @param _criterionHat The required hat // could also accept multiple hats in an array
  constructor(address _hats, uint256 _criterionHat) payable {
    hats = IHats(_hats);
    criterionHat = _criterionHat;
  }

  /*//////////////////////////////////////////////////////////////
                            OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

  /// @notice Allows to set the MACI contract
  function setMaciInstance(address _maci) public override onlyOwner {
    maci = _maci;
  }

  /*//////////////////////////////////////////////////////////////
                            GATEKEEPER FUNCTION
    //////////////////////////////////////////////////////////////*/

  /// @notice Registers the user
  /// @param _user The address of the user
  function register(address _user, bytes memory /*_data*/) public override {
    // ensure that the caller is the MACI contract
    if (maci != msg.sender) revert OnlyMACI();

    // _user must not be already registered
    if (registered[_user]) revert AlreadyRegistered();

    registered[_user] = true;

    // _user must be wearing the criterion hat
    if (!hats.isWearerOfHat(_user, criterionHat)) revert NotWearingCriterionHat();
  }
}

contract HatsGatekeeperMultiple is SignUpGatekeeper, Ownable {
  /// @notice The Hats Protocol contract address
  IHats public immutable hats;

  /// @notice Tracks hats that users must wear to be eligible to register
  mapping(uint256 => bool) public criterionHat;

  /// @notice the reference to the MACI contract
  address public maci;

  /// @notice Tracks registered users
  mapping(address => bool) public registered;

  /// @notice Deploy an instance of HatsGatekeeper
  /// @param _hats The Hats Protocol contract
  /// @param _criterionHats Array of accepted criterion hats
  constructor(address _hats, uint256[] memory _criterionHats) payable {
    hats = IHats(_hats);

    // add the criterion hats
    for (uint256 i; i < _criterionHats.length; ++i) {
      criterionHat[_criterionHats[i]] = true;
    }
  }

  /*//////////////////////////////////////////////////////////////
                            OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

  /// @notice Allows to set the MACI contract
  function setMaciInstance(address _maci) public override onlyOwner {
    maci = _maci;
  }

  /*//////////////////////////////////////////////////////////////
                            GATEKEEPER FUNCTION
    //////////////////////////////////////////////////////////////*/

  /// @notice Registers the user
  /// @param _user The address of the user
  /// @param _data additional data
  function register(address _user, bytes memory _data) public override {
    // ensure that the caller is the MACI contract
    if (maci != msg.sender) revert OnlyMACI();

    // _user must not be already registered
    if (registered[_user]) revert AlreadyRegistered();

    // decode the _data as a hat
    uint256 hat = abi.decode(_data, (uint256));

    // the hat must be set as a criterion hat
    if (!criterionHat[hat]) revert NotCriterionHat();

    registered[_user] = true;

    // _user must be wearing the criterion hat
    if (!hats.isWearerOfHat(_user, hat)) revert NotWearingCriterionHat();
  }
}
