// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

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
        emptyBallotRoots[0] = uint256(21288634699491752358045744278284938125177754968894213125839638595942376289538);
        emptyBallotRoots[1] = uint256(16580108909838304288733470846591479355580110598259241458216664276888288309182);
        emptyBallotRoots[2] = uint256(11398601065078358306346041150782313202958896665504603770748100400336158531661);
        emptyBallotRoots[3] = uint256(11445737076347613814826637798240628583157715612839727550968624379533742605625);
        emptyBallotRoots[4] = uint256(6864122289875410315537495166934606900586816767247639968950361192313290016938);

    }
}

