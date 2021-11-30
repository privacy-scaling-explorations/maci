// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { MACI } from '../MACI.sol';

abstract contract SignUpGatekeeper {
    function setMaciInstance(MACI _maci) public virtual {}
    function register(address _user, bytes memory _data) public virtual {}
}
