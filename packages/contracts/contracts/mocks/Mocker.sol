// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@excubiae/contracts/contracts/extensions/anonAadhaar/AnonAadhaarCheckerFactory.sol";
import "@excubiae/contracts/contracts/extensions/anonAadhaar/AnonAadhaarPolicyFactory.sol";
import "@excubiae/contracts/contracts/extensions/eas/EASCheckerFactory.sol";
import "@excubiae/contracts/contracts/extensions/eas/EASPolicyFactory.sol";
import "@excubiae/contracts/contracts/extensions/freeForAll/FreeForAllCheckerFactory.sol";
import "@excubiae/contracts/contracts/extensions/freeForAll/FreeForAllPolicyFactory.sol";
import "@excubiae/contracts/contracts/extensions/gitcoin/GitcoinPassportCheckerFactory.sol";
import "@excubiae/contracts/contracts/extensions/gitcoin/GitcoinPassportPolicyFactory.sol";
import "@excubiae/contracts/contracts/extensions/hats/HatsCheckerFactory.sol";
import "@excubiae/contracts/contracts/extensions/hats/HatsPolicyFactory.sol";
import "@excubiae/contracts/contracts/extensions/merkle/MerkleProofCheckerFactory.sol";
import "@excubiae/contracts/contracts/extensions/merkle/MerkleProofPolicyFactory.sol";
import "@excubiae/contracts/contracts/extensions/semaphore/SemaphoreCheckerFactory.sol";
import "@excubiae/contracts/contracts/extensions/semaphore/SemaphorePolicyFactory.sol";
import "@excubiae/contracts/contracts/extensions/token/TokenCheckerFactory.sol";
import "@excubiae/contracts/contracts/extensions/token/TokenPolicyFactory.sol";
import "@excubiae/contracts/contracts/extensions/zupass/ZupassCheckerFactory.sol";
import "@excubiae/contracts/contracts/extensions/zupass/ZupassPolicyFactory.sol";
import "@excubiae/contracts/contracts/test/extensions/mocks/MockAnonAadhaar.sol";
import "@excubiae/contracts/contracts/test/extensions/mocks/MockEAS.sol";
import "@excubiae/contracts/contracts/test/extensions/mocks/MockGitcoinPassportDecoder.sol";
import "@excubiae/contracts/contracts/test/extensions/mocks/MockHatsProtocol.sol";
import "@excubiae/contracts/contracts/test/extensions/mocks/MockToken.sol";
import "@excubiae/contracts/contracts/extensions/erc20votes/ERC20VotesPolicy.sol";
import "@excubiae/contracts/contracts/extensions/erc20votes/ERC20VotesPolicyFactory.sol";
import "@excubiae/contracts/contracts/extensions/erc20votes/ERC20VotesChecker.sol";
import "@excubiae/contracts/contracts/extensions/erc20votes/ERC20VotesCheckerFactory.sol";
import "@excubiae/contracts/contracts/extensions/erc20/ERC20Checker.sol";
import "@excubiae/contracts/contracts/extensions/erc20/ERC20CheckerFactory.sol";
import "@excubiae/contracts/contracts/extensions/erc20/ERC20Policy.sol";
import "@excubiae/contracts/contracts/extensions/erc20/ERC20PolicyFactory.sol";

/// @title Mocker
/// @notice Import all external contracts for tests
contract Mocker {}
