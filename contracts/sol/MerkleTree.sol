/*
 * semaphorejs - Zero-knowledge signaling on Ethereum
 * Copyright (C) 2020 Kobi Gurkan <kobigurk@gmail.com>
 * Copyright (C) 2020 Kendrick Tan <kendricktan0814@gmail.com>
 *
 * This file is part of semaphorejs.
 *
 * semaphorejs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * semaphorejs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with semaphorejs.  If not, see <http://www.gnu.org/licenses/>.
 */

pragma solidity ^0.5.0;

import { Hasher } from "./Hasher.sol";
import { Ownable } from "@openzeppelin/contracts/ownership/Ownable.sol";


contract MerkleTree is Ownable, Hasher {
    // Hasher object
    Hasher hasher;

    // Depth of the Merkle tree.
    // Number of leaves = 2^depth
    uint256 depth;

    // Current tree root
    uint256 root;

    // Value of the leaves
    uint256[] leaves;

    // Index to keep track of how many
    // leaves have been inserted in the tree
    uint256 nextLeafIndex;
    uint256 maxLeafIndex;

    // Filled 'subtrees' - used for optimized
    // inserting of new leaves
    uint256[] internal filledSubtrees;

    // Stores hashes of zeros
    uint256[] internal zeros;

    event LeafAdded(uint256 leaf, uint256 leafIndex);
    event LeafUpdated(uint256 leaf, uint256 leafIndex);

    constructor(
        uint256 _depth,
        uint256 _zeroValue
    ) public {
        // Depth of the tree
        depth = _depth;
        maxLeafIndex = 2**_depth;

        // 'Caches' zero values and filledSubTrees
        // for optimized inserts later on
        zeros.push(_zeroValue);
        filledSubtrees.push(zeros[0]);

        for (uint8 i = 1; i < depth; i++) {
            zeros.push(hashPair(zeros[i-1], zeros[i-1]));
            filledSubtrees.push(zeros[i]);
        }

        // Calculate current root
        root = hashPair(zeros[depth - 1], zeros[depth - 1]);
        nextLeafIndex = 0;
    }


    // Inserts (appends) a new leaf into the
    // merkle tree
    function insert(uint256 leaf) public onlyOwner {
        require(nextLeafIndex < maxLeafIndex, "Merkle Tree at max capacity");

        uint256 leafIndex = nextLeafIndex;
        uint256 currentIndex = nextLeafIndex;
        nextLeafIndex += 1;

        uint256 currentLevelHash = leaf;
        uint256 left;
        uint256 right;

        for (uint8 i = 0; i < depth; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = zeros[i];

                filledSubtrees[i] = currentLevelHash;
            } else {
                left = filledSubtrees[i];
                right = currentLevelHash;
            }

            currentLevelHash = hashPair(left, right);
            currentIndex /= 2;
        }

        root = currentLevelHash;
        leaves.push(leaf);

        emit LeafAdded(leaf, leafIndex);
    }

    /*
     * Make subsequent insertions start from leaf #1.
     * Leaf #0 will remain the zero value.
     */
    function insertBlankAtZerothLeaf() public onlyOwner {
        require(nextLeafIndex == 0, "MerkleTree: this function can only be called on an empty tree");
        nextLeafIndex += 1;
    }

    // Updates leaf of merkle tree at index `leafIndex`
    // TODO: remove the update function if it isn't used
    function update(
        uint256 leafIndex,
        uint256 leaf,
        uint256[] memory path
    ) public onlyOwner {
        require(leafIndex < nextLeafIndex, "Can't update a leaf which hasn't been inserted!");

        uint256 currentIndex = leafIndex;

        uint256 currentLevelHash = leaves[leafIndex];
        uint256 left;
        uint256 right;

        for (uint8 i = 0; i < depth; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = path[i];
            } else {
                left = path[i];
                right = currentLevelHash;
            }

            currentLevelHash = hashPair(left, right);
            currentIndex /= 2;
        }

        require(root == currentLevelHash, "MerkleTree: tree root / current level hash mismatch");

        currentIndex = leafIndex;
        currentLevelHash = leaf;

        for (uint8 i = 0; i < depth; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = path[i];
            } else {
                left = path[i];
                right = currentLevelHash;
            }

            currentLevelHash = hashPair(left, right);
            currentIndex /= 2;
        }

        root = currentLevelHash;
        leaves[leafIndex] = leaf;

        emit LeafUpdated(leaf, leafIndex);
    }

    function hashLeftRight(uint256 left, uint256 right) public pure returns (uint256) {
        return hashPair(left, right);
    }

    /*** Getters ***/
    function getRoot() public view returns (uint256) {
        return root;
    }

    function getDepth() public view returns (uint256) {
        return depth;
    }

    function getLeafAt(uint256 leafIndex) public view returns (uint256) {
        return leaves[leafIndex];
    }

    function getInsertedLeavesNo() public view returns (uint256) {
        return nextLeafIndex;
    }
}

contract EmptyMerkleTreeRoots {
    /*
     * These values are the roots of empty Merkle trees with depths 1 - 32.
     * Declaring them here allows us to save gas during deployment.
     * The zero value is the nothing-up-my-sleeve value we use for MACI:
     *     uint256(keccak256(abi.encodePacked('Maci'))) % SNARK_SCALAR_FIELD
     * or
     *     ethers.utils.solidityKeccak256(['bytes'], [ethers.utils.toUtf8Bytes('Maci')]) % 
     *     21888242871839275222246405745257275088548364400416034343698204186575808495617
     */

    uint256[] internal emptyMerkleTreeRoots = [
        11216515814987522599749256714720490509311069010865261692680994107687913037208,
        15070443635025256032372745622543115901279801731998073232281148355025856300326,
        3767457702292585941335343847514020180645625958005137684367365230527606760606,
        14013634237757196624276045167999701383332032282575978107798354713582054234207,
        1549162056030916627177222948670119766866370644676062102536054476222042416599,
        13776410877066614843865022855725816132223573485995866755319355206316537475807,
        8003056874825838062668411394512060142576863517180341689782033421968410884303,
        18556518584239629279057402691725227177879359096679539700906889785340472527327,
        11959053995163619356749504427903525079096069944371817398307367513233996062083,
        9429858676607958517189933578949711185695962004725959124415196390301943281008,
        494397599816498305232767205015906944709216870414885669291975129987963484752,
        21846436104072949996641611822206242560793521894858885055434261922264377655214,
        20406128755770329821677770283529843977771562708228748183094799050078131984516,
        21689329083993741545101683119400199682924981543948946258477037542329185766607,
        18324653973342985544213397312188609279050748201800523392394675920673653412706,
        17541536931075317690214796452167144016911404645397792014187664301105653218219,
        8774332163035471300746936210875260437820731472773223170258634683135595431744,
        12324074706602027948789802569586732108485461022785549271722814622573821854256,
        16055206896513011727804645346078746828681281154067139068134422594883515568200,
        1526193754858954165870080108312390729262637604377334806961468069169302103466,
        18480726683689281515082625325737985635002688659292885319660688025175341265848,
        14945806381271305433065524669347100732682485355992300233064251197647576287090,
        9159076338612419650609353952471096978522337179055517283435571813166866194557,
        20016929493749266215104244080306965706692576181551459252931066135874068558719,
        4859304685650055639366389275855506726550147612776938827366257081369435054381,
        12868542892785695977141971146790323156775810554925851477316023021688677084065,
        17328318232353213506629484612658912151742261508937691403030186272112399840036,
        11545299778660146319038612868260125949536949875840734701499025150132095646376,
        20982824850457689401883260243372023453154869690782362641390391462034401645403,
        15470826406231416055486369870695451209095574072912254615514143690148464002648,
        16214947145241410802868274202638335168787374594910872837774153016230527468991,
        2267906145570787269381031298544334383237571662442576373715526051270652209181
    ];
}
