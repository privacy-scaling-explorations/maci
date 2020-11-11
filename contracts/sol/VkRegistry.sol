// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/*
 * Stores verifying keys for the circuits.
 * Each circuit has a signature which is its compile-time constants represnted
 * as a uint256.
 */
contract VkRegistry is Ownable, SnarkCommon {

    mapping (uint256 => VerifyingKey) internal processVks; 
    mapping (uint256 => bool) internal isProcessVkSet; 

    mapping (uint256 => VerifyingKey) internal tallyVks; 
    mapping (uint256 => bool) internal isTallyVkSet; 

    function genProcessVkSig(
        uint256 _stateTreeDepth,
        uint256 _messageTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _batchSize
    ) internal pure returns (uint256) {
        return 
            (_batchSize << 192) +
            (_stateTreeDepth << 128) +
            (_messageTreeDepth << 64) +
            _voteOptionTreeDepth;
    }

    function genTallyVkSig(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _voteOptionTreeDepth
    ) internal pure returns (uint256) {
        return 
            (_stateTreeDepth << 128) +
            (_intStateTreeDepth << 64) +
            _voteOptionTreeDepth;
    }

    function setVerifyingKeys(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _messageTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _batchSize,
        VerifyingKey memory _processVk,
        VerifyingKey memory _tallyVk
    ) public onlyOwner {

        uint256 processVkSig = genProcessVkSig(
            _stateTreeDepth,
            _messageTreeDepth,
            _voteOptionTreeDepth,
            _batchSize
        );

        require(isProcessVkSet[processVkSig] == false, "VkRegistry: process vk already set");

        uint256 tallyVkSig = genTallyVkSig(
            _stateTreeDepth,
            _intStateTreeDepth,
            _voteOptionTreeDepth
        );

        require(isTallyVkSet[tallyVkSig] == false, "VkRegistry: tally vk already set");

        VerifyingKey storage processVk = processVks[processVkSig];
        processVk.alpha1 = _processVk.alpha1;
        processVk.beta2 = _processVk.beta2;
        processVk.gamma2 = _processVk.gamma2;
        processVk.delta2 = _processVk.delta2;
        for (uint8 i = 0; i < _processVk.ic.length; i ++) {
            processVk.ic.push(_processVk.ic[i]);
        }

        isProcessVkSet[processVkSig] = true;

        VerifyingKey storage tallyVk = tallyVks[tallyVkSig];
        tallyVk.alpha1 = _tallyVk.alpha1;
        tallyVk.beta2 = _tallyVk.beta2;
        tallyVk.gamma2 = _tallyVk.gamma2;
        tallyVk.delta2 = _tallyVk.delta2;
        for (uint8 i = 0; i < _tallyVk.ic.length; i ++) {
            tallyVk.ic.push(_tallyVk.ic[i]);
        }
        isTallyVkSet[tallyVkSig] = true;
    }

    function hasProcessVk(
        uint256 _stateTreeDepth,
        uint256 _messageTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _batchSize
    ) public view returns (bool) {
        uint256 sig = genProcessVkSig(
            _stateTreeDepth,
            _messageTreeDepth,
            _voteOptionTreeDepth,
            _batchSize
        );
        return isProcessVkSet[sig];
    }

    function getProcessVk(
        uint256 _stateTreeDepth,
        uint256 _messageTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _batchSize
    ) public view returns (VerifyingKey memory) {
        uint256 sig = genProcessVkSig(
            _stateTreeDepth,
            _messageTreeDepth,
            _voteOptionTreeDepth,
            _batchSize
        );

        require(isProcessVkSet[sig] == true, "VkRegistry: process verifying key not set");

        return processVks[sig];
    }

    function hasTallyVk(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _voteOptionTreeDepth
    ) public view returns (bool) {
        uint256 sig = genTallyVkSig(
            _stateTreeDepth,
            _intStateTreeDepth,
            _voteOptionTreeDepth
        );

        return isTallyVkSet[sig];
    }

    function getTallyVk(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _voteOptionTreeDepth
    ) public view returns (VerifyingKey memory) {
        uint256 sig = genTallyVkSig(
            _stateTreeDepth,
            _intStateTreeDepth,
            _voteOptionTreeDepth
        );

        require(isTallyVkSet[sig] == true, "VkRegistry: tally verifying key not set");

        return tallyVks[sig];
    }
}
