// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { ISimpleProjectRegistry } from "../interfaces/ISimpleProjectRegistry.sol";
import { ITally } from "../../interfaces/ITally.sol";

/// @title SimplePayout
/// @notice A simple payout contract that works with a SimpleProjectRegistry
/// and a MACI Tally contract
contract SimplePayout is Ownable(msg.sender) {
  /// @notice use safe ERC20 functions
  using SafeERC20 for IERC20;

  /// @notice the project registry
  ISimpleProjectRegistry public immutable projectRegistry;

  /// @notice the payout token
  address public immutable payoutToken;

  /// @notice the tally contract
  ITally public immutable tally;

  /// @notice keep track of which users have already been paid
  mapping(uint256 => bool) public paidProjects;

  /// @notice the total amount of tokens available to be paid out
  uint256 public immutable totalAmount;

  /// @notice the total amount of voice credits spent
  uint256 public immutable totalVoiceCreditsSpent;

  /// @notice keep track of how many users have been paid
  uint256 public paid;

  /// @notice Custom errors
  error InvalidSpentVoiceCredits();
  error ProjectAlreadyPaid();
  error InvalidProof();
  error NotAllProjectsPaid();
  error ZeroAddress();

  /// @notice Create a new instance of the payout contract
  /// @param _projectRegistry the address of the project registry
  /// @param _token the address of the payout token
  /// @param _tally the address of the tally contract
  /// @param _totalAmount the total amount of tokens available to be paid out
  /// @param _totalSpent the total amount of voice credits spent
  /// @param _totalSpentSalt the salt of the spent amount
  /// @param _resultCommitment the commitment of the results
  /// @param _perVOSpentVoiceCreditsHash the hash of the spent voice credits
  constructor(
    address _projectRegistry,
    address _token,
    address _tally,
    uint256 _totalAmount,
    uint256 _totalSpent,
    uint256 _totalSpentSalt,
    uint256 _resultCommitment,
    uint256 _perVOSpentVoiceCreditsHash
  ) payable {
    if (_token == address(0)) {
      revert ZeroAddress();
    }

    projectRegistry = ISimpleProjectRegistry(_projectRegistry);
    payoutToken = _token;
    tally = ITally(_tally);

    // set the total amount of tokens available to be paid out
    totalAmount = _totalAmount;

    // ensure that the total amount of voice credit spent is correct
    if (
      !ITally(_tally).verifySpentVoiceCredits(
        _totalSpent,
        _totalSpentSalt,
        _resultCommitment,
        _perVOSpentVoiceCreditsHash
      )
    ) revert InvalidSpentVoiceCredits();

    // set the total amount of voice credits spent
    totalVoiceCreditsSpent = _totalSpent;
  }

  /// @notice Deposit the amount of tokens to the contract
  /// @dev This function is only callable by the owner
  function deposit() external payable onlyOwner {
    // transfer the ERC20 token amount
    IERC20(payoutToken).safeTransferFrom(msg.sender, address(this), totalAmount);
  }

  /// @notice Payout the amount of tokens to the projects
  /// @param _voteOptionIndex the index of the vote option
  /// @param _spent the amount of voice credits spent
  /// @param _proof the proof of the spent amount
  /// @param _spentSalt the salt of the spent amount
  /// @param _resultsCommitment the commitment of the results
  /// @param _spentVoiceCreditsCommitment the commitment of the spent voice credits
  /// @param _voteOptionTreeDepth the depth of the vote option tree
  function payout(
    uint256 _voteOptionIndex,
    uint256 _spent,
    uint256[][] calldata _proof,
    uint256 _spentSalt,
    uint256 _resultsCommitment,
    uint256 _spentVoiceCreditsCommitment,
    uint8 _voteOptionTreeDepth
  ) external {
    // check if the user has been paid already
    if (paidProjects[_voteOptionIndex]) revert ProjectAlreadyPaid();
    // set the vote option index as paid
    paidProjects[_voteOptionIndex] = true;

    // increment the number of paid users
    unchecked {
      paid++;
    }

    // get the address of the project
    address project = projectRegistry.getProject(_voteOptionIndex).project;

    // we verify the proof
    if (
      !tally.verifyPerVOSpentVoiceCredits(
        _voteOptionIndex,
        _spent,
        _proof,
        _spentSalt,
        _voteOptionTreeDepth,
        _spentVoiceCreditsCommitment,
        _resultsCommitment
      )
    ) revert InvalidProof();

    // we need to calculate the amount that is to be given to the project (round down)
    uint256 tokensToPay = (_spent * totalAmount) / totalVoiceCreditsSpent;

    // transfer the token amount
    // check whether is native token
    IERC20(payoutToken).safeTransfer(project, tokensToPay);
  }

  /// @notice A function to collect the dust left from round downs
  /// can only be called once all projects have been paid
  function collectDust() external onlyOwner {
    // check if all projects have been paid
    if (projectRegistry.getProjectsNumber() != paid) revert NotAllProjectsPaid();

    address token = payoutToken;

    // transfer the ERC20 token amount
    IERC20(token).safeTransfer(msg.sender, IERC20(token).balanceOf(address(this)));
  }
}
