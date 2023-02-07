// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { MACI } from '../MACI.sol';

abstract contract SignUpGatekeeper {
    function setMaciInstance(MACI _maci) public virtual {}
    function register(address _user, bytes memory _data) public virtual {}
}
