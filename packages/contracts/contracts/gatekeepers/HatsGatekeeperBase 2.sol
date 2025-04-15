// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { IHats } from "../interfaces/IHats.sol";
import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";

/// @title HatsGatekeeperBase
/// @notice Abstract contract containing the base elements of a Hats Gatekeeper contract
abstract contract HatsGatekeeperBase is SignUpGatekeeper, Ownable(msg.sender) {
  /*//////////////////////////////////////////////////////////////
                              CUSTOM ERRORS
    //////////////////////////////////////////////////////////////*/

  error OnlyMACI();
  error NotWearingCriterionHat();
  error AlreadyRegistered();
  error ZeroAddress();

  /*//////////////////////////////////////////////////////////////
                            PUBLIC CONSTANTS
    //////////////////////////////////////////////////////////////*/

  /// @notice The Hats Protocol contract address
  IHats public immutable hats;

  /*//////////////////////////////////////////////////////////////
                          PUBLIC STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

  /// @notice the reference to the MACI contract
  address public maci;

  /// @notice Tracks registered users
  mapping(address => bool) public registered;

  /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

  /// @notice Deploy an instance of HatsGatekeeper
  /// @param _hats The Hats Protocol contract
  constructor(address _hats) payable {
    hats = IHats(_hats);
  }

  /*//////////////////////////////////////////////////////////////
                            OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

  /// @notice Allows to set the MACI contract
  /// @param _maci The MACI contract interface to be stored
  function setMaciInstance(address _maci) public override onlyOwner {
    if (_maci == address(0)) revert ZeroAddress();
    maci = _maci;
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function getTrait() public pure virtual override returns (string memory) {
    return "Hats";
  }
}
