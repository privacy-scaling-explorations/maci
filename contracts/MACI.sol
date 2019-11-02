pragma solidity 0.5.11;

import "./Verifier.sol";
import "./MerkleTree.sol";
import "./SignUpToken.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract MACI is Verifier, Ownable, IERC721Receiver {
    // Append-only merkle tree to represent
    // internal state transitions
    // i.e. update function isn't used
    MerkleTree cmdTree;

    // NOTE: This is only used to represent the
    // initial stage of the stateTree
    // i.e. Used to sign users up
    MerkleTree stateTree;

    // Whitelisted address (make sure they have signed up)
    mapping (address => bool) whitelistedAddresses;
    mapping (address => bool) signedUpAddresses;

    // Events
    event CommandPublished(
        uint256[] encryptedMessage,
        uint256[2] ecdhPublicKey,
        uint256 hashedEncryptedMessage,
        uint256 newCmdTreeRoot
    );

    constructor(address cmdTreeAddress) Ownable() public {
        cmdTree = MerkleTree(cmdTreeAddress);
    }

    // On ERC721 transferred to the contract, this function is called.
    // This acts as the way to allow users to sign up to the contract.
    // i.e. Only users who have the `SignUpToken` is allowed to publish
    //      a message, once
    function onERC721Received(address sender, uint256, bytes memory) public returns(bytes4) {
        whitelistedAddresses[sender] = true;

        // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
        // Which is the expected magic number to return for this interface
        return 0x150b7a02;
    }

    // mimc7.hashMulti convinience function
    function hashMulti(uint256[] memory array) public pure returns (uint256) {
        uint256 r = 15021630795539610737508582392395901278341266317943626182700664337106830745361;

        for (uint i = 0; i < array.length; i++){
            r = MiMC.MiMCpe7(r, array[i]);
        }

        return r;
    }

    // Publishes a command to the cmdTree
    function publishCommand(
        uint256[] memory encryptedMessage,
        uint256[2] memory ecdhPublicKey
    ) public {
        require(whitelistedAddresses[msg.sender] == true, "Address is not whitelisted!");
        require(signedUpAddresses[msg.sender] == false, "Address is not whitelisted!");

        // Calculate leaf value
        uint256 leaf = hashMulti(encryptedMessage);

        // Insert the new leaf into the cmdTree
        cmdTree.insert(leaf);

        // Get new cmd tree root
        uint256 newCmdTreeRoot = cmdTree.getRoot();

        // Each user can only sign up once
        signedUpAddresses[msg.sender] = true;

        emit CommandPublished(
            encryptedMessage,
            ecdhPublicKey,
            leaf,
            newCmdTreeRoot
        );
    }

}

