// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {IMACI} from "./IMACI.sol";
import {MessageProcessor} from "./MessageProcessor.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Poll} from "./Poll.sol";
import {SnarkCommon} from "./crypto/SnarkCommon.sol";
import {CommonUtilities} from "./Utility.sol";
import {Verifier} from "./crypto/Verifier.sol";
import {VkRegistry} from "./VkRegistry.sol";

contract Subsidy is
    Ownable,
    CommonUtilities,
    SnarkCommon
{

    uint256 public rbi; // row batch index
    uint256 public cbi; // column batch index
    // The final commitment to the state and ballot roots
    uint256 public sbCommitment;
    uint256 public subsidyCommitment;

    // Error codes
    string constant ERROR_VOTING_PERIOD_NOT_PASSED = "SubsidyE01";
    string constant ERROR_PROCESSING_NOT_COMPLETE = "SubsidyE02";
    string constant ERROR_INVALID_SUBSIDY_PROOF = "SubsidyE03";
    string constant ERROR_ALL_SUBSIDY_CALCULATED = "SubsidyE04";
    string constant ERROR_VK_NOT_SET = "SubsidyE05";

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

    // TODO: make sure correct mp address is passed or change to private function
    // TODO: reuse subsidy.sol for multiple polls
    function updateSbCommitment(MessageProcessor _mp) public {
        // Require that all messages have been processed
        require(_mp.processingComplete(), ERROR_PROCESSING_NOT_COMPLETE);
        if (sbCommitment == 0) {
            sbCommitment = _mp.sbCommitment();
        }
    }


    function genSubsidyPackedVals(uint256 _numSignUps)
        public
        view
        returns (uint256)
    {
        // TODO: ensure that each value is less than or equal to 2 ** 50
        uint256 result = (_numSignUps << uint256(100)) +
            (rbi << uint256(50)) +
            cbi;

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
    ) public onlyOwner votingPeriodOver(_poll) {
        updateSbCommitment(_mp);

        (uint8 intStateTreeDepth, , , uint8 voteOptionTreeDepth) = _poll
            .treeDepths();
        uint256 subsidyBatchSize = 5**intStateTreeDepth; // treeArity is fixed to 5
        (uint256 numSignUps, ) = _poll.numSignUpsAndMessages();
        uint256 numLeaves = numSignUps + 1;

        // Require that there are unfinished ballots left
        require(
            rbi * subsidyBatchSize <= numLeaves,
            ERROR_ALL_SUBSIDY_CALCULATED
        );
        require(
            cbi * subsidyBatchSize <= numLeaves,
            ERROR_ALL_SUBSIDY_CALCULATED
        );

        bool isValid = verifySubsidyProof(
            _poll,
            _proof,
            numSignUps,
            _newSubsidyCommitment
        );
        require(isValid, ERROR_INVALID_SUBSIDY_PROOF);
        subsidyCommitment = _newSubsidyCommitment;
        increaseSubsidyIndex(subsidyBatchSize, numLeaves);
    }

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
        (VkRegistry vkRegistry, IMACI maci, , ) = _poll.extContracts();

        require(address(vkRegistry) != address(0), ERROR_VK_NOT_SET);

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
