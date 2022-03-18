// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/*
 * Stores verifying keys for the circuits.
 * Each circuit has a signature which is its compile-time constants represented
 * as a uint256.
 */
contract VkRegistry is Ownable, SnarkCommon {

    mapping (uint256 => VerifyingKey) internal processVks; 
    mapping (uint256 => bool) internal processVkSet; 

    mapping (uint256 => VerifyingKey) internal tallyVks; 
    mapping (uint256 => bool) internal tallyVkSet; 

    mapping (uint256 => VerifyingKey) internal coeffVks; 
    mapping (uint256 => bool) internal coeffVkSet; 

    //TODO: event for setVerifyingKeys

    function isProcessVkSet(uint256 _sig) public view returns (bool) {
        return processVkSet[_sig];
    }

    function isTallyVkSet(uint256 _sig) public view returns (bool) {
        return tallyVkSet[_sig];
    }

    function isCoeffVkSet(uint256 _sig) public view returns (bool) {
        return coeffVkSet[_sig];
    }

    function genProcessVkSig(
        uint256 _stateTreeDepth,
        uint256 _messageTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _messageBatchSize
    ) public pure returns (uint256) {
        return 
            (_messageBatchSize << 192) +
            (_stateTreeDepth << 128) +
            (_messageTreeDepth << 64) +
            _voteOptionTreeDepth;
    }

    function genTallyVkSig(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _voteOptionTreeDepth
    ) public pure returns (uint256) {
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
        uint256 _messageBatchSize,
        uint256 _intCoeffTreeDepth,
        uint256 _coeffTreeDepth,
        VerifyingKey memory _processVk,
        VerifyingKey memory _tallyVk,
        VerifyingKey memory _coeffVk
    ) public onlyOwner {

        uint256 processVkSig = genProcessVkSig(
            _stateTreeDepth,
            _messageTreeDepth,
            _voteOptionTreeDepth,
            _messageBatchSize
        );

        require(processVkSet[processVkSig] == false, "VkRegistry: process vk already set");

        uint256 tallyVkSig = genTallyVkSig(
            _stateTreeDepth,
            _intStateTreeDepth,
            _voteOptionTreeDepth
        );

        require(tallyVkSet[tallyVkSig] == false, "VkRegistry: tally vk already set");

        uint256 coeffVkSig = genCoeffVkSig(
            _stateTreeDepth,
            _intStateTreeDepth,
            _voteOptionTreeDepth,
            _intCoeffTreeDepth,
            _coeffTreeDepth
        );

        require(coeffVkSet[coeffVkSig] == false, "VkRegistry: coeff vk already set");

        VerifyingKey storage processVk = processVks[processVkSig];
        processVk.alpha1 = _processVk.alpha1;
        processVk.beta2 = _processVk.beta2;
        processVk.gamma2 = _processVk.gamma2;
        processVk.delta2 = _processVk.delta2;
        for (uint8 i = 0; i < _processVk.ic.length; i ++) {
            processVk.ic.push(_processVk.ic[i]);
        }

        processVkSet[processVkSig] = true;

        VerifyingKey storage tallyVk = tallyVks[tallyVkSig];
        tallyVk.alpha1 = _tallyVk.alpha1;
        tallyVk.beta2 = _tallyVk.beta2;
        tallyVk.gamma2 = _tallyVk.gamma2;
        tallyVk.delta2 = _tallyVk.delta2;
        for (uint8 i = 0; i < _tallyVk.ic.length; i ++) {
            tallyVk.ic.push(_tallyVk.ic[i]);
        }
        tallyVkSet[tallyVkSig] = true;

        VerifyingKey storage coeffVk = coeffVks[coeffVkSig];
        coeffVk.alpha1 = _coeffVk.alpha1;
        coeffVk.beta2 = _coeffVk.beta2;
        coeffVk.gamma2 = _coeffVk.gamma2;
        coeffVk.delta2 = _coeffVk.delta2;
        for (uint8 i = 0; i < _coeffVk.ic.length; i ++) {
            coeffVk.ic.push(_coeffVk.ic[i]);
        }
        coeffVkSet[coeffVkSig] = true;
    }

    function hasProcessVk(
        uint256 _stateTreeDepth,
        uint256 _messageTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _messageBatchSize
    ) public view returns (bool) {
        uint256 sig = genProcessVkSig(
            _stateTreeDepth,
            _messageTreeDepth,
            _voteOptionTreeDepth,
            _messageBatchSize
        );
        return processVkSet[sig];
    }

    function getProcessVkBySig(
        uint256 _sig
    ) public view returns (VerifyingKey memory) {
        require(processVkSet[_sig] == true, "VkRegistry: process verifying key not set");

        return processVks[_sig];
    }

    function getProcessVk(
        uint256 _stateTreeDepth,
        uint256 _messageTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _messageBatchSize
    ) public view returns (VerifyingKey memory) {
        uint256 sig = genProcessVkSig(
            _stateTreeDepth,
            _messageTreeDepth,
            _voteOptionTreeDepth,
            _messageBatchSize
        );

        return getProcessVkBySig(sig);
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

        return tallyVkSet[sig];
    }

    function getTallyVkBySig(
        uint256 _sig
    ) public view returns (VerifyingKey memory) {
        require(tallyVkSet[_sig] == true, "VkRegistry: tally verifying key not set");

        return tallyVks[_sig];
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

        return getTallyVkBySig(sig);
    }

    function hasCoeffVk(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _intCoeffTreeDepth,
        uint256 _coeffTreeDepth
    ) public view returns (bool) {
        uint256 sig = genCoeffVkSig(
            _stateTreeDepth,
            _intStateTreeDepth,
            _voteOptionTreeDepth,
            _intCoeffTreeDepth,
            _coeffTreeDepth
        );
        return coeffVkSet[sig];
    }

    function getCoeffVk(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _intCoeffTreeDepth,
        uint256 _coeffTreeDepth
    ) public view returns (VerifyingKey memory) {
        uint256 sig = genCoeffVkSig(
            _stateTreeDepth,
            _intStateTreeDepth,
            _voteOptionTreeDepth,
            _intCoeffTreeDepth,
            _coeffTreeDepth
        );

        return getCoeffVkBySig(sig);
    }

    function genCoeffVkSig(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _intCoeffTreeDepth,
        uint256 _coeffTreeDepth
    ) public pure returns (uint256) {
        return 
            (_stateTreeDepth << 192) +
            (_intStateTreeDepth << 144) +
            (_voteOptionTreeDepth << 96 ) +
            (_intCoeffTreeDepth << 48) +
            _coeffTreeDepth;

    }

    function getCoeffVkBySig(
        uint256 _sig
    ) public view returns (VerifyingKey memory) {
        require(coeffVkSet[_sig] == true, "VkRegistry: coeff calculation verifying key not set");
        return coeffVks[_sig];
    }

}
