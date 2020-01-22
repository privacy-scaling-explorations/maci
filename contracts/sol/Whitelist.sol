pragma solidity 0.5.11;

import "@openzeppelin/contracts/ownership/Ownable.sol";

contract Whitelist is Ownable {
    mapping (address => bool) whitelist;

    modifier whitelisted() {
        require(whitelist[msg.sender], "Whitelist: caller is not in the whitelist");
        _;
    }

    function whitelistAddress (address user) public onlyOwner {
        whitelist[user] = true;
    }

    function unWhitelistAddress (address user) public onlyOwner {
        whitelist[user] = false;
    }
}
