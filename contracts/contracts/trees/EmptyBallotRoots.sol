// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

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
    emptyBallotRoots[0] = uint256(6579820437991406069687396372962263845395426835385368878767605633903648955255);
    emptyBallotRoots[1] = uint256(9105453741665960449792281626882014222103501499246287334255160659262747058842);
    emptyBallotRoots[2] = uint256(14830222164980158319423900821611648302565544940504586015002280367515043751869);
    emptyBallotRoots[3] = uint256(12031563002271722465187541954825013132282571927669361737331626664787916495335);
    emptyBallotRoots[4] = uint256(5204612805325639173251450278876337947880680931527922506745154187077640790699);
  }
}
