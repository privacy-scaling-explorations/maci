// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {IMACI} from "./IMACI.sol";
import {MessageProcessor} from "./MessageProcessor.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Poll} from "./Poll.sol";
import {SnarkCommon} from "./crypto/SnarkCommon.sol";
import {Hasher} from "./crypto/Hasher.sol";
import {CommonUtilities} from "./utilities/Utility.sol";
import {Verifier} from "./crypto/Verifier.sol";
import {VkRegistry} from "./VkRegistry.sol";

contract Subsidy is Ownable, CommonUtilities, Hasher, SnarkCommon {
    uint256 public rbi; // row batch index
    uint256 public cbi; // column batch index
    // The final commitment to the state and ballot roots
    uint256 public sbCommitment;
    uint256 public subsidyCommitment;

    uint8 public constant treeArity = 5;

    // Error codes
    error PROCESSING_NOT_COMPLETE();
    error INVALID_SUBSIDY_PROOF();
    error ALL_SUBSIDY_CALCULATED();
    error VK_NOT_SET();

    Verifier public verifier;

    constructor(Verifier _verifier) {
        verifier = _verifier;
    }

    // TODO: make sure correct mp address is passed or change to private function
    // TODO: reuse subsidy.sol for multiple polls
    function updateSbCommitment(MessageProcessor _mp) public {
        // Require that all messages have been processed
        if (!_mp.processingComplete()) {
            revert PROCESSING_NOT_COMPLETE();
        }
        if (sbCommitment == 0) {
            sbCommitment = _mp.sbCommitment();
        }
    }

    function genSubsidyPackedVals(uint256 _numSignUps)
        public
        view
        returns (uint256)
    {
        require(_numSignUps < 2**50, "numSignUps too large");
        require(rbi < 2**50, "rbi too large");
        require(cbi < 2**50, "cbi too large");
        uint256 result = (_numSignUps << 100) + (rbi << 50) + cbi;

        return result;
    }

    function genSubsidyPublicInputHash(
        uint256 _numSignUps,
        uint256 _newSubsidyCommitment
    ) public view returns (uint256) {
        uint256 packedVals = genSubsidyPackedVals(_numSignUps);
        uint256[] memory input = new uint256[](4);
        input[0] = packedVals;
        input[1] = sbCommitment;
        input[2] = subsidyCommitment;
        input[3] = _newSubsidyCommitment;
        uint256 inputHash = sha256Hash(input);
        return inputHash;
    }

    function updateSubsidy(
        Poll _poll,
        MessageProcessor _mp,
        uint256 _newSubsidyCommitment,
        uint256[8] memory _proof
    ) external onlyOwner {
        _votingPeriodOver(_poll);
        updateSbCommitment(_mp);

        (uint8 intStateTreeDepth, , , ) = _poll.treeDepths();

        uint256 subsidyBatchSize = uint256(treeArity)**intStateTreeDepth;

        (uint256 numSignUps, , ) = _poll
            .numSignUpsAndMessagesAndDeactivatedKeys();
        uint256 numLeaves = numSignUps + 1;

        // Require that there are unfinished ballots left
        if (rbi * subsidyBatchSize > numLeaves) {
            revert ALL_SUBSIDY_CALCULATED();
        }

        bool isValid = verifySubsidyProof(
            _poll,
            _proof,
            numSignUps,
            _newSubsidyCommitment
        );
        if (!isValid) {
            revert INVALID_SUBSIDY_PROOF();
        }
        subsidyCommitment = _newSubsidyCommitment;
        increaseSubsidyIndex(subsidyBatchSize, numLeaves);
    }

    /*
     * @notice increase subsidy batch index (rbi, cbi) to next,
     * it will try to cbi++ if the whole batch can fit into numLeaves
     * otherwise it will increase row index: rbi++
     * @param batchSize: the size of 1 dimensional batch over the signup users,
     * notice each batch for subsidy calculation is 2 dimenional: batchSize*batchSize
     * @param numLeaves: total number of leaves in stateTree, i.e. number of signup users
     * @return None
     */
    function increaseSubsidyIndex(uint256 batchSize, uint256 numLeaves)
        internal
    {
        if (cbi * batchSize + batchSize < numLeaves) {
            cbi++;
        } else {
            rbi++;
            cbi = rbi;
        }
    }

    function verifySubsidyProof(
        Poll _poll,
        uint256[8] memory _proof,
        uint256 _numSignUps,
        uint256 _newSubsidyCommitment
    ) public view returns (bool) {
        (uint8 intStateTreeDepth, , , uint8 voteOptionTreeDepth) = _poll
            .treeDepths();
        (VkRegistry vkRegistry, IMACI maci, , , ) = _poll.extContracts();

        if (address(vkRegistry) == address(0)) {
            revert VK_NOT_SET();
        }

        // Get the verifying key
        VerifyingKey memory vk = vkRegistry.getSubsidyVk(
            maci.stateTreeDepth(),
            intStateTreeDepth,
            voteOptionTreeDepth
        );

        // Get the public inputs
        uint256 publicInputHash = genSubsidyPublicInputHash(
            _numSignUps,
            _newSubsidyCommitment
        );

        // Verify the proof
        return verifier.verify(_proof, vk, publicInputHash);
    }
}
