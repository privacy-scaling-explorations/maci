pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Mintable.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract SignUpToken is ERC721Full, ERC721Mintable, Ownable {
  // Keeps track of total tokens
  uint256 curTokenId = 1;

  constructor() ERC721Full("SignUpToken", "SignUpToken") Ownable() public { }

  // Gives an ERC721 token to an address
  function giveToken(address to) public onlyOwner {
    _mint(to, curTokenId);
    curTokenId += 1;
  }

  // How many tokens are allocated
  function getCurrentSupply() public view returns (uint256) {
    return curTokenId;
  }
}
