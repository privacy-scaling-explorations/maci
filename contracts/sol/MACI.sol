pragma solidity 0.5.11;

import { Ownable } from "@openzeppelin/contracts/ownership/Ownable.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import { Hasher } from "./Hasher.sol";
import { MerkleTree } from "./MerkleTree.sol";
import { SignUpToken } from "./SignUpToken.sol";

import { BatchUpdateStateTreeVerifier } from "./BatchUpdateStateTreeVerifier.sol";

contract MACI is Hasher, Ownable, IERC721Receiver {
    // Verifier Contracts
    BatchUpdateStateTreeVerifier batchUstVerifier;

    // Append-only merkle tree to represent internal state transitions
    // i.e. update function isn't used
    // TODO: remove the update function if it isn't used
    MerkleTree cmdTree;
    MerkleTree stateTree;

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

    // A nothing up my sleeve zero value
    // Should be equal to 5503045433092194285660061905880311622788666850989422096966288514930349325741
    uint256 SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 ZERO_VALUE = uint256(keccak256(abi.encodePacked('MACI'))) % SNARK_SCALAR_FIELD;

    // Events
    event SignedUp(
        uint256[] encryptedMessage,
        uint256[2] ecdhPublicKey,
        uint256 hashedEncryptedMessage,
        uint256 newStateTreeRoot,
        uint256 userIndex
    );
    event CommandPublished(
        uint256[] encryptedMessage,
        uint256[2] ecdhPublicKey,
        uint256 hashedEncryptedMessage,
        uint256 newCmdTreeRoot
    );

    constructor(
      uint8 cmdTreeDepth,
      uint8 stateTreeDepth,
      address batchUpdateStateTreeVerifierAddress,
      address _signUpTokenAddress,
      uint256 _durationSignUpBlockNumber,
      uint256 _coordinatorPublicKeyX,
      uint256 _coordinatorPublicKeyY
    ) Ownable() public {

        // Create the Merkle trees
        cmdTree = new MerkleTree(cmdTreeDepth, ZERO_VALUE);
        stateTree = new MerkleTree(stateTreeDepth, ZERO_VALUE);

        batchUstVerifier = BatchUpdateStateTreeVerifier(batchUpdateStateTreeVerifierAddress);

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
        uint256 leaf = hashMulti(encryptedMessage, 0);

        stateTree.insert(leaf);

        // Get new cmd tree root
        uint256 newStateTreeRoot = stateTree.getRoot();

        addressAccountAllocated[msg.sender] -= 1;

        emit SignedUp(
            encryptedMessage,
            ecdhPublicKey,
            leaf,
            newStateTreeRoot,
            stateTree.getInsertedLeavesNo() - 1
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
        uint256 leaf = hashMulti(encryptedMessage, 0);

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

    // Submits proof for updating state tree
    function verifyUpdateStateTreeProof(
      uint[2] memory a,
      uint[2][2] memory b,
      uint[2] memory c,
      uint[28] memory input
    ) public view returns (bool) {
      //return batchUstVerifier.verifyProof(a, b, c, input);
      // TODO: submit a batch of messages
      return true;
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

