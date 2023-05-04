// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {AccQueue} from "./trees/AccQueue.sol";
import {IMACI} from "./IMACI.sol";
import {Hasher} from "./crypto/Hasher.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Poll} from "./Poll.sol";
import {MessageProcessor} from "./MessageProcessor.sol";
import {SnarkCommon} from "./crypto/SnarkCommon.sol";
import {Verifier} from "./crypto/Verifier.sol";
import {VkRegistry} from "./VkRegistry.sol";
import {CommonUtilities} from "./utilities/Utility.sol";


contract Tally is
    Ownable,
    SnarkCommon,
    CommonUtilities,
    Hasher
{
    // Error codes
    error PROCESSING_NOT_COMPLETE();
    error INVALID_TALLY_VOTES_PROOF();
    error ALL_BALLOTS_TALLIED();

    uint8 private constant LEAVES_PER_NODE = 5;

    // The commitment to the tally results. Its initial value is 0, but after
    // the tally of each batch is proven on-chain via a zk-SNARK, it should be
    // updated to:
    //
    // hash3(
    //   hashLeftRight(merkle root of current results, salt0)
    //   hashLeftRight(number of spent voice credits, salt1),
    //   hashLeftRight(merkle root of the no. of spent voice credits per vote option, salt2)
    // )
    //
    // Where each salt is unique and the merkle roots are of arrays of leaves
    // TREE_ARITY ** voteOptionTreeDepth long.
    uint256 public tallyCommitment;

    uint256 public tallyBatchNum;

    // The final commitment to the state and ballot roots
    uint256 public sbCommitment;

    Verifier public verifier;

    constructor(Verifier _verifier) {
        verifier = _verifier;
    }


    /*
     * @notice Pack the batch start index and number of signups into a 100-bit value.
     * @param _numSignUps: number of signups
     * @param _batchStartIndex: the start index of given batch
     * @param _tallyBatchSize: size of batch
     * @return an uint256 representing 3 inputs together
     */
    function genTallyVotesPackedVals(
        uint256 _numSignUps,
        uint256 _batchStartIndex,
        uint256 _tallyBatchSize
    ) public pure returns (uint256) {
        require(_numSignUps < 2**50, "numSignUPs out of range");
        require(_batchStartIndex < 2**50, "batchStartIndex out of range");
        require(_tallyBatchSize < 2**50, "tallyBatchSize out of range");

        uint256 result = (_batchStartIndex / _tallyBatchSize) +
            (_numSignUps << uint256(50));

        return result;
    }

    /*
     * @notice generate hash of public inputs for tally circuit
     * @param _numSignUps: number of signups
     * @param _batchStartIndex: the start index of given batch
     * @param _tallyBatchSize: size of batch
     * @param _newTallyCommitment: the new tally commitment to be updated
     * @return hash of public inputs
     */
    function genTallyVotesPublicInputHash(
        uint256 _numSignUps,
        uint256 _batchStartIndex,
        uint256 _tallyBatchSize,
        uint256 _newTallyCommitment
    ) public view returns (uint256) {
        uint256 packedVals = genTallyVotesPackedVals(
            _numSignUps,
            _batchStartIndex,
            _tallyBatchSize
        );
        uint256[] memory input = new uint256[](4);
        input[0] = packedVals;
        input[1] = sbCommitment;
        input[2] = tallyCommitment;
        input[3] = _newTallyCommitment;
        uint256 inputHash = sha256Hash(input);
        return inputHash;
    }

    function updateSbCommitment(MessageProcessor _mp) public onlyOwner {
        // Require that all messages have been processed
        if (!_mp.processingComplete()) {
            revert PROCESSING_NOT_COMPLETE();
        }
        if (sbCommitment == 0) {
            sbCommitment = _mp.sbCommitment();
        }
    }

    function tallyVotes(
        Poll _poll,
        MessageProcessor _mp,
        uint256 _newTallyCommitment,
        uint256[8] memory _proof
    ) public onlyOwner {
        _votingPeriodOver(_poll);
        updateSbCommitment(_mp);

        (, uint256 tallyBatchSize, ) = _poll.batchSizes();
        uint256 batchStartIndex = tallyBatchNum * tallyBatchSize;
        (uint256 numSignUps, ) = _poll.numSignUpsAndMessages();

        // Require that there are untalied ballots left
        if (batchStartIndex > numSignUps) {
            revert ALL_BALLOTS_TALLIED();
        }

        bool isValid = verifyTallyProof(
            _poll,
            _proof,
            numSignUps,
            batchStartIndex,
            tallyBatchSize,
            _newTallyCommitment
        );
        if (!isValid) {
            revert INVALID_TALLY_VOTES_PROOF();
        }

        // Update the tally commitment and the tally batch num
        tallyCommitment = _newTallyCommitment;
        tallyBatchNum++;
    }

    /*
     * @notice Verify the tally proof using the verifiying key
     * @param _poll contract address of the poll proof to be verified
     * @param _proof the proof generated after processing all messages
     * @param _numSignUps number of signups for a given poll
     * @param _batchStartIndex the number of batches multiplied by the size of the batch
     * @param _tallyBatchSize batch size for the tally
     * @param _newTallyCommitment the tally commitment to be verified at a given batch index
     * @return valid a boolean representing successful verification
     */
    function verifyTallyProof(
        Poll _poll,
        uint256[8] memory _proof,
        uint256 _numSignUps,
        uint256 _batchStartIndex,
        uint256 _tallyBatchSize,
        uint256 _newTallyCommitment
    ) public view returns (bool) {
        (uint8 intStateTreeDepth, , , uint8 voteOptionTreeDepth) = _poll
            .treeDepths();

        (VkRegistry vkRegistry, IMACI maci, , ) = _poll.extContracts();

        // Get the verifying key
        VerifyingKey memory vk = vkRegistry.getTallyVk(
            maci.stateTreeDepth(),
            intStateTreeDepth,
            voteOptionTreeDepth
        );

        // Get the public inputs
        uint256 publicInputHash = genTallyVotesPublicInputHash(
            _numSignUps,
            _batchStartIndex,
            _tallyBatchSize,
            _newTallyCommitment
        );

        // Verify the proof
        uint256[] memory input = new uint256[](1);
        input[0] = publicInputHash;
        return verifier.verify(_proof, vk, input);
    }

    function computeMerkleRootFromPath(
        uint8 _depth,
        uint256 _index,
        uint256 _leaf,
        uint256[][] memory _pathElements
    ) internal pure returns (uint256) {
        uint256 pos = _index % LEAVES_PER_NODE;
        uint256 current = _leaf;
        uint8 k;

        uint256[LEAVES_PER_NODE] memory level;

        for (uint8 i = 0; i < _depth; ++i) {
            for (uint8 j = 0; j < LEAVES_PER_NODE; ++j) {
                if (j == pos) {
                    level[j] = current;
                } else {
                    if (j > pos) {
                        k = j - 1;
                    } else {
                        k = j;
                    }
                    level[j] = _pathElements[i][k];
                }
            }

            _index /= LEAVES_PER_NODE;
            pos = _index % LEAVES_PER_NODE;
            current = hash5(level);
        }
        return current;
    }

}
