pragma solidity 0.5.11;

import "./Verifier.sol";
import "./MerkleTree.sol";
import "./SignUpToken.sol";
import "./Hasher.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract MACI is Verifier, Ownable, IERC721Receiver {
    // Hasher
    Hasher hasher;

    // Append-only merkle tree to represent
    // internal state transitions
    // i.e. update function isn't used
    MerkleTree cmdTree;

    // What block did the contract get deployed
    uint256 deployedBlockNumber;

    // Duration of the sign up process, in block numbers
    uint256 durationSignUpBlockNumbers;

    // Whitelisted address (make sure they have signed up)
    mapping (address => bool) whitelistedAddresses;
    mapping (address => bool) signedUpAddresses;

    // Events
    event SignedUp(
        uint256[] encryptedMessage,
        uint256[2] ecdhPublicKey,
        uint256 hashedEncryptedMessage,
        uint256 newCmdTreeRoot
    );
    event CommandPublished(
        uint256[] encryptedMessage,
        uint256[2] ecdhPublicKey,
        uint256 hashedEncryptedMessage,
        uint256 newCmdTreeRoot
    );

    constructor(
      address cmdTreeAddress,
      address hasherAddress,
      uint256 _durationSignUpBlockNumber
    ) Ownable() public {
        cmdTree = MerkleTree(cmdTreeAddress);
        hasher = Hasher(hasherAddress);

        deployedBlockNumber = block.number;
        durationSignUpBlockNumbers = _durationSignUpBlockNumber;
    }

    // On ERC721 transferred to the contract, this function is called.
    // This acts as the way to allow users to sign up to the contract.
    // i.e. Only users who have the `SignUpToken` is allowed to publish
    //      a message, once
    function onERC721Received(address sender, address, uint256, bytes memory) public returns(bytes4) {
        whitelistedAddresses[sender] = true;

        // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
        // Which is the expected magic number to return for this interface
        return this.onERC721Received.selector;
    }

    // Signs a user up
    function signUp(
        uint256[] memory encryptedMessage,
        uint256[2] memory ecdhPublicKey
    ) public {
        require(
          block.number <= deployedBlockNumber + durationSignUpBlockNumbers,
          "Sign up process ended!"
        );
        require(whitelistedAddresses[msg.sender] == true, "Address is not whitelisted!");
        require(signedUpAddresses[msg.sender] == false, "Address is not whitelisted!");

        // Calculate leaf value
        uint256 leaf = hasher.hashMulti(encryptedMessage);

        // Insert the new leaf into the cmdTree
        cmdTree.insert(leaf);

        // Get new cmd tree root
        uint256 newCmdTreeRoot = cmdTree.getRoot();

        // Each user can only sign up once
        signedUpAddresses[msg.sender] = true;

        emit SignedUp(
            encryptedMessage,
            ecdhPublicKey,
            leaf,
            newCmdTreeRoot
        );
    }

    // Publishes commands
    function publishCommand(
        uint256[] memory encryptedMessage,
        uint256[2] memory ecdhPublicKey
    ) public {
        require(
          block.number > deployedBlockNumber + durationSignUpBlockNumbers,
          "Sign up process ongoing!"
        );

        // Calculate leaf value
        uint256 leaf = hasher.hashMulti(encryptedMessage);

        // Insert the new leaf into the cmdTree
        cmdTree.insert(leaf);

        // Get new cmd tree root
        uint256 newCmdTreeRoot = cmdTree.getRoot();

        emit CommandPublished(
            encryptedMessage,
            ecdhPublicKey,
            leaf,
            newCmdTreeRoot
        );
    }

    // Gets meta information concerning deployment time
    function getMetaInfo() public view returns (uint256, uint256) {
      return (deployedBlockNumber, durationSignUpBlockNumbers);
    }
}

