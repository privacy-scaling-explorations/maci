pragma solidity 0.5.11;

import "./Verifier.sol";
import "./MerkleTree.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract MACI is Verifier, Ownable {
    // Append-only merkle tree to represent
    // internal state transitions
    // i.e. update function isn't used
    MerkleTree cmdTree;

    // resultsTree
    // NOTE: This is only used to represent the
    // initial stages
    MerkleTree stateTree;

    // TODO: Implement whitelist for Public-keys
    // hashMulti(publicKey) => uint256
    mapping (uint256 => bool) whitelistedPublickeys;

    // Events
    event CommandPublished(
        uint256[] encryptedMessage,
        uint256[2] publisherPublicKey,
        uint256 hashedEncryptedMessage,
        uint256 newCmdTreeRoot
    );

    // Register our merkle trees
    constructor(
        address cmdTreeAddress
    ) Ownable() public {
        cmdTree = MerkleTree(cmdTreeAddress);
    }

    // mimc7.hashMulti function
    function hashMulti(
        uint256[] memory array
    ) public view returns (uint256) {
        uint256 r = 15021630795539610737508582392395901278341266317943626182700664337106830745361;

        for (uint i = 0; i < array.length; i++){
            r = MiMC.MiMCpe7(r, array[i]);
        }

        return r;
    }

    // Publishes a command to the registry
    function publishCommand(
        uint256[] memory encryptedMessage,
        uint256[2] memory publisherPublicKey
    ) public {
        // Calculate leaf value
        uint256 leaf = hashMulti(encryptedMessage);

        // Insert the new leaf into the cmdTree
        cmdTree.insert(leaf);

        // Get new cmd tree root
        uint256 newCmdTreeRoot = cmdTree.getRoot();

        emit CommandPublished(
            encryptedMessage,
            publisherPublicKey,
            leaf,
            newCmdTreeRoot
        );
    }
}
