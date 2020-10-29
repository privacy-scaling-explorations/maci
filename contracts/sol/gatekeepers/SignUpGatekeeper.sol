// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

abstract contract SignUpGatekeeper {
    function register(address _user, bytes memory _data) virtual public {}
}
