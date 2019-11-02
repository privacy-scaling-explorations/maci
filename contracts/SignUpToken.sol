pragma solidity 0.5.11;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Mintable.sol";

contract SignUpToken is ERC721Full, ERC721Mintable {
  constructor() ERC721Full("SignUpToken", "SignUpToken") public {
  }
}
