// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {SnarkCommon} from "./crypto/SnarkCommon.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/*
 * Stores verifying keys for the circuits.
 * Each circuit has a signature which is its compile-time constants represented
 * as a uint256.
 */
contract VkRegistry is Ownable, SnarkCommon {
    mapping(uint256 => VerifyingKey) internal processVks;
    mapping(uint256 => bool) internal processVkSet;

    mapping(uint256 => VerifyingKey) internal processDeactivationVks;
    mapping(uint256 => bool) internal processDeactivationVkSet;

    mapping(uint256 => VerifyingKey) internal tallyVks;
    mapping(uint256 => bool) internal tallyVkSet;

    mapping(uint256 => VerifyingKey) internal subsidyVks;
    mapping(uint256 => bool) internal subsidyVkSet;

    mapping(uint256 => VerifyingKey) internal newKeyGenerationVks;
    mapping(uint256 => bool) internal newKeyGenerationVkSet;

    event ProcessVkSet(uint256 _sig);
    event ProcessDeactivationVkSet(uint256 _sig);
    event TallyVkSet(uint256 _sig);
    event SubsidyVkSet(uint256 _sig);
    event NewKeyGenerationVkSet(uint256 _sig);

    function isProcessVkSet(uint256 _sig) public view returns (bool) {
        return processVkSet[_sig];
    }

    function isTallyVkSet(uint256 _sig) public view returns (bool) {
        return tallyVkSet[_sig];
    }

    function isSubsidyVkSet(uint256 _sig) public view returns (bool) {
        return subsidyVkSet[_sig];
    }

    function isGenNewKeyGenerationVkSet(uint256 _sig) public view returns (bool) {
        return newKeyGenerationVkSet[_sig];
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

    function genProcessDeactivationVkSig(
        uint256 _stateTreeDepth,
        uint256 _deactivationTreeDepth
    ) public pure returns (uint256) {
        return (_stateTreeDepth << 128) + _deactivationTreeDepth;
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

    function genSubsidyVkSig(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _voteOptionTreeDepth
    ) public pure returns (uint256) {
        return
            (_stateTreeDepth << 128) +
            (_intStateTreeDepth << 64) +
            _voteOptionTreeDepth;
    }

    function genNewKeyGenerationVkSig(
        uint256 _stateTreeDepth,
        uint256 _messageTreeDepth
    ) public pure returns (uint256) {
        return
            (_stateTreeDepth << 128) + _messageTreeDepth;
    }

    function setVerifyingKeys(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _messageTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _messageBatchSize,
        VerifyingKey memory _processVk,
        VerifyingKey memory _deactivationVk,
        VerifyingKey memory _tallyVk,
        VerifyingKey memory _newKeyGenerationVk
    ) public onlyOwner {
        uint256 processVkSig = genProcessVkSig(
            _stateTreeDepth,
            _messageTreeDepth,
            _voteOptionTreeDepth,
            _messageBatchSize
        );

        require(
            !processVkSet[processVkSig],
            "VkRegistry: process vk already set"
        );

        uint256 deactivationVkSig = genProcessDeactivationVkSig(
            _stateTreeDepth,
            _messageTreeDepth
        );

        require(
            !processDeactivationVkSet[deactivationVkSig],
            "VkRegistry: process deactivation vk already set"
        );

        uint256 tallyVkSig = genTallyVkSig(
            _stateTreeDepth,
            _intStateTreeDepth,
            _voteOptionTreeDepth
        );

        require(!tallyVkSet[tallyVkSig], "VkRegistry: tally vk already set");

        uint256 newKeyGenerationVkSig = genNewKeyGenerationVkSig(
            _stateTreeDepth,
            _messageTreeDepth
        );

        require(
            !newKeyGenerationVkSet[newKeyGenerationVkSig],
            "VkRegistry: new key generation vk already set"
        );

        VerifyingKey storage processVk = processVks[processVkSig];
        processVk.alpha1 = _processVk.alpha1;
        processVk.beta2 = _processVk.beta2;
        processVk.gamma2 = _processVk.gamma2;
        processVk.delta2 = _processVk.delta2;
        for (uint8 i = 0; i < _processVk.ic.length; i++) {
            processVk.ic.push(_processVk.ic[i]);
        }

        processVkSet[processVkSig] = true;

        VerifyingKey storage deactivationVk = processDeactivationVks[
            deactivationVkSig
        ];
        deactivationVk.alpha1 = _deactivationVk.alpha1;
        deactivationVk.beta2 = _deactivationVk.beta2;
        deactivationVk.gamma2 = _deactivationVk.gamma2;
        deactivationVk.delta2 = _deactivationVk.delta2;
        for (uint8 i = 0; i < _deactivationVk.ic.length; i++) {
            deactivationVk.ic.push(_deactivationVk.ic[i]);
        }

        processDeactivationVkSet[deactivationVkSig] = true;

        VerifyingKey storage tallyVk = tallyVks[tallyVkSig];
        tallyVk.alpha1 = _tallyVk.alpha1;
        tallyVk.beta2 = _tallyVk.beta2;
        tallyVk.gamma2 = _tallyVk.gamma2;
        tallyVk.delta2 = _tallyVk.delta2;
        for (uint8 i = 0; i < _tallyVk.ic.length; i++) {
            tallyVk.ic.push(_tallyVk.ic[i]);
        }
        tallyVkSet[tallyVkSig] = true;

        VerifyingKey storage newKeyGenerationVk = newKeyGenerationVks[newKeyGenerationVkSig];
        newKeyGenerationVk.alpha1 = _newKeyGenerationVk.alpha1;
        newKeyGenerationVk.beta2 = _newKeyGenerationVk.beta2;
        newKeyGenerationVk.gamma2 = _newKeyGenerationVk.gamma2;
        newKeyGenerationVk.delta2 = _newKeyGenerationVk.delta2;
        for (uint8 i = 0; i < _newKeyGenerationVk.ic.length; i++) {
            newKeyGenerationVk.ic.push(_newKeyGenerationVk.ic[i]);
        }
        newKeyGenerationVkSet[newKeyGenerationVkSig] = true;

        emit NewKeyGenerationVkSet(newKeyGenerationVkSig);
        emit TallyVkSet(tallyVkSig);
        emit ProcessDeactivationVkSet(deactivationVkSig);
        emit ProcessVkSet(processVkSig);
    }

    function setSubsidyKeys(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _voteOptionTreeDepth,
        VerifyingKey memory _subsidyVk
    ) public onlyOwner {
        uint256 subsidyVkSig = genSubsidyVkSig(
            _stateTreeDepth,
            _intStateTreeDepth,
            _voteOptionTreeDepth
        );

        require(
            !subsidyVkSet[subsidyVkSig],
            "VkRegistry: subsidy vk already set"
        );

        VerifyingKey storage subsidyVk = subsidyVks[subsidyVkSig];
        subsidyVk.alpha1 = _subsidyVk.alpha1;
        subsidyVk.beta2 = _subsidyVk.beta2;
        subsidyVk.gamma2 = _subsidyVk.gamma2;
        subsidyVk.delta2 = _subsidyVk.delta2;
        for (uint8 i = 0; i < _subsidyVk.ic.length; i++) {
            subsidyVk.ic.push(_subsidyVk.ic[i]);
        }
        subsidyVkSet[subsidyVkSig] = true;

        emit SubsidyVkSet(subsidyVkSig);
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
        require(
            processVkSet[_sig],
            "VkRegistry: process verifying key not set"
        );

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

    function getProcessDeactivationVkBySig(
        uint256 _sig
    ) public view returns (VerifyingKey memory) {
        require(
            processDeactivationVkSet[_sig],
            "VkRegistry: deactivation verifying key not set"
        );

        return processDeactivationVks[_sig];
    }

    function getProcessDeactivationVk(
        uint256 _stateTreeDepth,
        uint256 _deactivationTreeDepth
    ) public view returns (VerifyingKey memory) {
        uint256 sig = genProcessDeactivationVkSig(
            _stateTreeDepth,
            _deactivationTreeDepth
        );

        return getProcessDeactivationVkBySig(sig);
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
        require(tallyVkSet[_sig], "VkRegistry: tally verifying key not set");

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

    function getnewKeyGenerationVkBySig(
        uint256 _sig
    ) public view returns (VerifyingKey memory) {
        require(
            newKeyGenerationVkSet[_sig],
            "VkRegistry: new key generation verifying key not set"
        );

        return newKeyGenerationVks[_sig];
    }

    function getNewKeyGenerationVk(
        uint256 _stateTreeDepth,
        uint256 _messageTreeDepth
    ) public view returns (VerifyingKey memory) {
        uint256 sig = genNewKeyGenerationVkSig(
            _stateTreeDepth,
            _messageTreeDepth
        );

        return getnewKeyGenerationVkBySig(sig);
    }

    function hasSubsidyVk(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _voteOptionTreeDepth
    ) public view returns (bool) {
        uint256 sig = genSubsidyVkSig(
            _stateTreeDepth,
            _intStateTreeDepth,
            _voteOptionTreeDepth
        );

        return subsidyVkSet[sig];
    }

    function getSubsidyVkBySig(
        uint256 _sig
    ) public view returns (VerifyingKey memory) {
        require(
            subsidyVkSet[_sig],
            "VkRegistry: subsidy verifying key not set"
        );

        return subsidyVks[_sig];
    }

    function getSubsidyVk(
        uint256 _stateTreeDepth,
        uint256 _intStateTreeDepth,
        uint256 _voteOptionTreeDepth
    ) public view returns (VerifyingKey memory) {
        uint256 sig = genSubsidyVkSig(
            _stateTreeDepth,
            _intStateTreeDepth,
            _voteOptionTreeDepth
        );

        return getSubsidyVkBySig(sig);
    }
}
