pragma solidity 0.5.11;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Mintable.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract SignUpToken is ERC721Full, ERC721Mintable, Ownable {
  uint256 curTokenId = 0;

  constructor() ERC721Full("SignUpToken", "SignUpToken") Ownable() public {
  }

  function giveToken(address to) public onlyOwner {
    _mint(to, curTokenId);
    curTokenId += 1;
  }
}
