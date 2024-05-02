// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract EmptyBallotRoots {
  // emptyBallotRoots contains the roots of Ballot trees of five leaf
  // configurations.
  // Each tree has a depth of 10, which is the hardcoded state tree depth.
  // Each leaf is an empty ballot. A configuration refers to the depth of the
  // voice option tree for that ballot.

  // The leaf for the root at index 0 contains hash(0, root of a VO tree with
  // depth 1 and zero-value 0)

  // The leaf for the root at index 1 contains hash(0, root of a VO tree with
  // depth 2 and zero-value 0)

  // ... and so on.

  // The first parameter to the hash function is the nonce, which is 0.

  uint256[5] internal emptyBallotRoots;

  constructor() {
    emptyBallotRoots[0] = uint256(16015576667038038422103932363190100635991292382181099511410843174865570503661);
    emptyBallotRoots[1] = uint256(166510078825589460025300915201657086611944528317298994959376081297530246971);
    emptyBallotRoots[2] = uint256(10057734083972610459557695472359628128485394923403014377687504571662791937025);
    emptyBallotRoots[3] = uint256(4904828619307091008204672239231377290495002626534171783829482835985709082773);
    emptyBallotRoots[4] = uint256(18694062287284245784028624966421731916526814537891066525886866373016385890569);
  }
}
