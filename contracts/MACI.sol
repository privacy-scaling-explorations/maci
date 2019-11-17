pragma solidity 0.5.11;

import "./Verifier.sol";
import "./MerkleTree.sol";
import "./SignUpToken.sol";
import "./Hasher.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract MACI is Verifier, Ownable, IERC721Receiver {
    // Hashing function
    Hasher hasher;

    // Append-only merkle tree to represent
    // internal state transitions
    // i.e. update function isn't used
    MerkleTree cmdTree;

    // What block did the contract get deployed
    uint256 deployedBlockNumber;

    // Duration of the sign up process, in block numbers
    uint256 durationSignUpBlockNumbers;

    // Address that has been allocated an account
    // Note: An address can sign up multiple times
    //       if they have > 1 ERC721 tokens
    //       ensure that addressAccountAllocated[address] > 0
    //       before allowing them to sign up
    mapping (address => uint256) addressAccountAllocated;

    // Address of the SignUpToken
    address signUpTokenAddress;

    // Owner can also forcefully terminate voting period
    bool signUpForceEnded = false;

    // Coordinator Public Key
    uint256 coordinatorPublicKeyX;
    uint256 coordinatorPublicKeyY;

    // Events
    event SignedUp(
        uint256[] encryptedMessage,
        uint256[2] ecdhPublicKey,
        uint256 hashedEncryptedMessage,
        uint256 newCmdTreeRoot,
        uint256 userIndex
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
      address _signUpTokenAddress,
      uint256 _durationSignUpBlockNumber,
      uint256 _coordinatorPublicKeyX,
      uint256 _coordinatorPublicKeyY
    ) Ownable() public {
        cmdTree = MerkleTree(cmdTreeAddress);
        hasher = Hasher(hasherAddress);

        deployedBlockNumber = block.number;
        durationSignUpBlockNumbers = _durationSignUpBlockNumber;
        signUpTokenAddress = _signUpTokenAddress;

        coordinatorPublicKeyX = _coordinatorPublicKeyX;
        coordinatorPublicKeyY = _coordinatorPublicKeyY;
    }

    // On ERC721 transferred to the contract, this function is called.
    // This acts as the way to allow users to sign up to the contract.
    // i.e. Only users who have the `SignUpToken` is allowed to publish
    //      a message, once
    function onERC721Received(address sender, address, uint256, bytes memory) public returns(bytes4) {
        require(msg.sender == signUpTokenAddress, "Contract does not accept the provided ERC721 tokens");
        addressAccountAllocated[sender] += 1;

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
          block.number <= deployedBlockNumber + durationSignUpBlockNumbers && !signUpForceEnded,
          "Sign up process ended!"
        );
        require(addressAccountAllocated[msg.sender] > 0, "Address is not whitelisted!");

        // Calculate leaf value
        uint256 leaf = hasher.hashMulti(encryptedMessage);

        // Insert the new leaf into the cmdTree
        cmdTree.insert(leaf);

        // Get new cmd tree root
        uint256 newCmdTreeRoot = cmdTree.getRoot();

        addressAccountAllocated[msg.sender] -= 1;

        emit SignedUp(
            encryptedMessage,
            ecdhPublicKey,
            leaf,
            newCmdTreeRoot,
            cmdTree.getInsertedLeavesNo() - 1
        );
    }

    // Publishes commands
    function publishCommand(
        uint256[] memory encryptedMessage,
        uint256[2] memory ecdhPublicKey
    ) public {
        require(
          block.number > deployedBlockNumber + durationSignUpBlockNumbers || signUpForceEnded,
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

    // Forcefully ends sign up period
    function endSignUpPeriod() public onlyOwner {
      signUpForceEnded = true;
    }

    // Checks if sign up period has ended
    function hasSignUpPeriodEnded() public view returns (bool) {
      return (block.number > deployedBlockNumber + durationSignUpBlockNumbers) || signUpForceEnded;
    }

    // Gets meta information concerning deployment time
    function getMetaInfo() public view returns (uint256, uint256) {
      return (deployedBlockNumber, durationSignUpBlockNumbers);
    }

    // Gets coordinator public key
    function getCoordinatorPublicKey() public view returns (uint256, uint256) {
      return (coordinatorPublicKeyX, coordinatorPublicKeyY);
    }
}

