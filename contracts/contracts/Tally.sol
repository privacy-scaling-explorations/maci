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


contract Tally is
    Ownable,
    SnarkCommon,
    Hasher
{
    // Error codes
    string constant ERROR_VOTING_PERIOD_NOT_PASSED = "TallyE01";
    string constant ERROR_PROCESSING_NOT_COMPLETE = "TallyE02";
    string constant ERROR_INVALID_TALLY_VOTES_PROOF = "TallyE03";
    string constant ERROR_ALL_BALLOTS_TALLIED = "TallyE04";

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

    modifier votingPeriodOver(Poll _poll) {
        (uint256 deployTime, uint256 duration) = _poll
            .getDeployTimeAndDuration();
        // Require that the voting period is over
        uint256 secondsPassed = block.timestamp - deployTime;
        require(secondsPassed > duration, ERROR_VOTING_PERIOD_NOT_PASSED);
        _;
    }

    /*
     * Pack the batch start index and number of signups into a 100-bit value.
     */
    function genTallyVotesPackedVals(
        uint256 _numSignUps,
        uint256 _batchStartIndex,
        uint256 _tallyBatchSize
    ) public pure returns (uint256) {
        // TODO: ensure that each value is less than or equal to 2 ** 50
        uint256 result = (_batchStartIndex / _tallyBatchSize) +
            (_numSignUps << uint256(50));

        return result;
    }

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

    // TODO: make sure correct mp address is passed or change to private function
    // TODO: reuse tally.sol for multiple polls
    function updateSbCommitment(MessageProcessor _mp) public {
        // Require that all messages have been processed
        require(_mp.processingComplete(), ERROR_PROCESSING_NOT_COMPLETE);
        if (sbCommitment == 0) {
            sbCommitment = _mp.sbCommitment();
        }
    }

    function tallyVotes(
        Poll _poll,
        MessageProcessor _mp,
        uint256 _newTallyCommitment,
        uint256[8] memory _proof
    ) public onlyOwner votingPeriodOver(_poll) {
        updateSbCommitment(_mp);

        (, uint256 tallyBatchSize, ) = _poll.batchSizes();
        uint256 batchStartIndex = tallyBatchNum * tallyBatchSize;
        (uint256 numSignUps, ) = _poll.numSignUpsAndMessages();

        // Require that there are untalied ballots left
        require(batchStartIndex <= numSignUps, ERROR_ALL_BALLOTS_TALLIED);

        bool isValid = verifyTallyProof(
            _poll,
            _proof,
            numSignUps,
            batchStartIndex,
            tallyBatchSize,
            _newTallyCommitment
        );
        require(isValid, ERROR_INVALID_TALLY_VOTES_PROOF);

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
        return verifier.verify(_proof, vk, publicInputHash);
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


     /*
     * @notice Verify the result generated of the tally.json
     * @param _voteOptionIndex the index of the vote option to verify the correctness of the tally
     * @param _tallyResult Flattened array of the tally
     * @param _tallyResultProof Corresponding proof of the tally result
     * @param _tallyResultSalt the respective salt in the results object in the tally.json
     * @param _spentVoiceCreditsHash hashLeftRight(number of spent voice credits, spent salt)
     * @param _perVOSpentVoiceCreditsHash hashLeftRight(merkle root of the no spent voice credits per vote option, perVOSpentVoiceCredits salt)
     * @param _tallyCommitment newTallyCommitment field in the tally.json
     * @return valid a boolean representing successful verification
     */
    function verifyTallyResult(
        Poll _poll,
        uint256 _voteOptionIndex,
        uint256 _tallyResult,
        uint256[][] memory _tallyResultProof,
        uint256 _spentVoiceCreditsHash,
        uint256 _perVOSpentVoiceCreditsHash,
        uint256 _tallyCommitment
    ) public view returns (bool) {
        (, , , uint8 voteOptionTreeDepth) = _poll.treeDepths();
        uint256 computedRoot = computeMerkleRootFromPath(
            voteOptionTreeDepth,
            _voteOptionIndex,
            _tallyResult,
            _tallyResultProof
        );

        uint256[3] memory tally;
        tally[0] = computedRoot;
        tally[1] = _spentVoiceCreditsHash;
        tally[2] = _perVOSpentVoiceCreditsHash;

        return hash3(tally) == _tallyCommitment;
    }
}
