// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {PoseidonT2, PoseidonT3, PoseidonT4, PoseidonT5, PoseidonT6, PoseidonT7} from "./Poseidon.sol";

import {Multicallable} from "./Multicallable.sol";
import {LibClone} from "./LibClone.sol";

// deploy all the Poseidon contracts in one tx
// try to break that down into tasks

contract PoseidonFactory is Multicallable {
    /// -----------------------------------------------------------------------
    /// Library Usage
    /// -----------------------------------------------------------------------

    using LibClone for address; //hacks

    /// -----------------------------------------------------------------------
    /// Events
    /// -----------------------------------------------------------------------
    
    event PoseidonT2Deployed(PoseidonT2 indexed poseidonT2);
    event PoseidonT3Deployed(PoseidonT3 indexed poseidonT3);
    event PoseidonT4Deployed(PoseidonT4 indexed poseidonT4);
    event PoseidonT5Deployed(PoseidonT5 indexed poseidonT5);
    event PoseidonT6Deployed(PoseidonT6 indexed poseidonT6);
    event PoseidonT7Deployed(PoseidonT7 indexed poseidonT7);
    
    /// -----------------------------------------------------------------------
    /// Immutables
    /// -----------------------------------------------------------------------

    PoseidonT2 internal immutable poseidonT2Template;
    PoseidonT3 internal immutable poseidonT3Template;
    PoseidonT4 internal immutable poseidonT4Template;
    PoseidonT5 internal immutable poseidonT5Template;
    PoseidonT6 internal immutable poseidonT6Template;
    PoseidonT7 internal immutable poseidonT7Template;

    /// -----------------------------------------------------------------------
    /// Constructor
    /// -----------------------------------------------------------------------

    constructor(PoseidonT2 _poseidonT2Template, PoseidonT3 _poseidonT3Template, PoseidonT4 _poseidonT4Template, PoseidonT5 _poseidonT5Template, PoseidonT6 _poseidonT6Template, PoseidonT7 _poseidonT7Template) payable {
        poseidonT2Template = _poseidonT2Template;
        poseidonT3Template = _poseidonT3Template;
        poseidonT4Template = _poseidonT4Template;
        poseidonT5Template = _poseidonT5Template;
        poseidonT6Template = _poseidonT6Template;
        poseidonT7Template = _poseidonT7Template;
    }

    /// -----------------------------------------------------------------------
    /// Deployment Logic
    /// -----------------------------------------------------------------------

    function determinePoseidonT2(bytes32 salt) public view virtual returns (address) {
        return
            address(poseidonT2Template).predictDeterministicAddress(
                abi.encodePacked(),
                salt,
                address(this)
            );
    }

    function determinePoseidonT3(bytes32 salt) public view virtual returns (address) {
        return
            address(poseidonT3Template).predictDeterministicAddress(
                abi.encodePacked(),
                salt,
                address(this)
            );
    }

    function determinePoseidonT4(bytes32 salt) public view virtual returns (address) {
        return
            address(poseidonT4Template).predictDeterministicAddress(
                abi.encodePacked(),
                salt,
                address(this)
            );
    }

    function determinePoseidonT5(bytes32 salt) public view virtual returns (address) {
        return
            address(poseidonT5Template).predictDeterministicAddress(
                abi.encodePacked(),
                salt,
                address(this)
            );
    }

    function determinePoseidonT6(bytes32 salt) public view virtual returns (address) {
        return
            address(poseidonT6Template).predictDeterministicAddress(
                abi.encodePacked(),
                salt,
                address(this)
            );
    }

    function determinePoseidonT7(bytes32 salt) public view virtual returns (address) {
        return
            address(poseidonT7Template).predictDeterministicAddress(
                abi.encodePacked(),
                salt,
                address(this)
            );
    }


    function deployPoseidonT2(
        bytes32 salt // create2 salt.
    ) public payable virtual {
        PoseidonT2 poseidonT2 = PoseidonT2(
            address(poseidonT2Template).cloneDeterministic(
                abi.encodePacked(), // we dont have constructor args
                salt
            )
        );

        emit PoseidonT2Deployed(poseidonT2);
    }

    function deployPoseidonT3(
        bytes32 salt // create2 salt.
    ) public payable virtual {
        PoseidonT3 poseidonT3 = PoseidonT3(
            address(poseidonT3Template).cloneDeterministic(
                abi.encodePacked(), // we dont have constructor args
                salt
            )
        );

        emit PoseidonT3Deployed(poseidonT3);
    }

    function deployPoseidonT4(
        bytes32 salt // create2 salt.
    ) public payable virtual {
        PoseidonT4 poseidonT4 = PoseidonT4(
            address(poseidonT4Template).cloneDeterministic(
                abi.encodePacked(), // we dont have constructor args
                salt
            )
        );

        emit PoseidonT4Deployed(poseidonT4);
    }

    function deployPoseidonT5(
        bytes32 salt // create2 salt.
    ) public payable virtual {
        PoseidonT5 poseidonT5 = PoseidonT5(
            address(poseidonT5Template).cloneDeterministic(
                abi.encodePacked(), // we dont have constructor args
                salt
            )
        );

        emit PoseidonT5Deployed(poseidonT5);
    }

    function deployPoseidonT6(
        bytes32 salt // create2 salt.
    ) public payable virtual {
        PoseidonT6 poseidonT6 = PoseidonT6(
            address(poseidonT6Template).cloneDeterministic(
                abi.encodePacked(), // we dont have constructor args
                salt
            )
        );

        emit PoseidonT6Deployed(poseidonT6);
    }

    function deployPoseidonT7(
        bytes32 salt // create2 salt.
    ) public payable virtual {
        PoseidonT7 poseidonT7 = PoseidonT7(
            address(poseidonT7Template).cloneDeterministic(
                abi.encodePacked(), // we dont have constructor args
                salt
            )
        );

        emit PoseidonT7Deployed(poseidonT7);
    }
}