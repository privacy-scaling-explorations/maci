// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { ISimpleProjectRegistry } from "../interfaces/ISimpleProjectRegistry.sol";

/// @title SimpleProjectRegistry
/// @notice This contract is a simple registry of projects
/// @dev This does not constrain the number of projects
/// which might be > vote options
/// @dev it does not prevent duplicate addresses from being
/// added as projects
/// @notice it does not allow to remove projects either
contract SimpleProjectRegistry is Ownable(msg.sender), ISimpleProjectRegistry {
  /// @notice simple storage of projects is an array of addresses with the the index being the position in the array
  RegistryProject[] internal projects;

  /// @notice registry metadata url
  bytes32 internal immutable metadataUrl;

  /// @notice Create a new instance of the registry contract
  /// @param _metadataUrl the registry metadata url
  constructor(bytes32 _metadataUrl) payable {
    metadataUrl = _metadataUrl;
  }

  /// @notice Add a project to the registry
  /// @param project The address of the project to add
  function addProject(RegistryProject calldata project) external onlyOwner {
    projects.push(project);
  }

  /// @notice Add multiple projects to the registry
  /// @param _projects The addresses of the projects to add
  function addProjects(RegistryProject[] calldata _projects) external onlyOwner {
    uint256 len = _projects.length;
    for (uint256 i = 0; i < len; ) {
      projects.push(_projects[i]);

      unchecked {
        i++;
      }
    }
  }

  /// @inheritdoc ISimpleProjectRegistry
  function getRegistryMetadataUrl() external view returns (bytes32) {
    return metadataUrl;
  }

  /// @inheritdoc ISimpleProjectRegistry
  function getProject(uint256 index) external view returns (RegistryProject memory) {
    return projects[index];
  }

  /// @inheritdoc ISimpleProjectRegistry
  function getProjects() external view returns (RegistryProject[] memory) {
    return projects;
  }

  /// @inheritdoc ISimpleProjectRegistry
  function getProjectsNumber() external view returns (uint256) {
    return projects.length;
  }
}
