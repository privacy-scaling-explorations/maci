// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ISimpleProjectRegistry
/// @notice An interface for a simple project registry
interface ISimpleProjectRegistry {
  /// @notice A struct representing a single registry project.
  struct RegistryProject {
    // project metadata url
    bytes32 metadataUrl;
    // project address
    address project;
  }

  /// @notice Get a registry metadata url
  /// @return The metadata url in bytes32 format
  function getRegistryMetadataUrl() external view returns (bytes32);

  /// @notice Get a project
  /// @param index The index of the project
  /// @return The address of the project
  function getProject(uint256 index) external view returns (RegistryProject memory);

  /// @notice Get all projects
  /// @return The addresses of the projects
  function getProjects() external view returns (RegistryProject[] memory);

  /// @notice Get the number of projects
  /// @return The number of projects
  function getProjectsNumber() external view returns (uint256);
}
