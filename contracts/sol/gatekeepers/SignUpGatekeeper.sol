// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

abstract contract SignUpGatekeeper {
    function register(address _user, bytes memory _data) virtual public {}
}
