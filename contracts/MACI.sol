pragma solidity 0.5.11;

import "./Verifier.sol";
import "./MerkleTree.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract MACI is Verifier, Ownable {
    // Append-only merkle tree to represent internal state
    // i.e. update function isn't used
    MerkleTree executionStateMT;

    // Merkle tree to store all whitelisted public keys
    MerkleTree registryMT;

    // Events
    event MessagePublished(
        uint256[] encryptedMessage,
        uint256[2] publisherPublicKey,
        uint256 hashedEncryptedMessage
    );
    event MessageInserted(
        uint256 hashedEncryptedMessage
    );
    event UserInserted(
        uint256 hashedEncryptedMessage, uint256 userIndex
    );
    event UserUpdated(
        uint256 oldHashedEncryptedMessage,
        uint256 newHashedEncryptedMessage,
        uint256 userIndex
    );

    // Register our merkle trees
    constructor(
        address executionStateMTAddress,
        address registryMTAddress
    ) Ownable() public {
        executionStateMT = MerkleTree(executionStateMTAddress);
        registryMT = MerkleTree(registryMTAddress);
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

    // Publishes a message to the registry
    // The message is the `encryptedData`
    // If the message can be decrypted successfully
    // and the signature can be verified
    // then the executionStateMT is appended with the message
    function pubishMessage(
        uint256[] memory encryptedMessage,
        uint256[2] memory publisherPublicKey
    ) public {
        uint256 hashedEncryptedMessaghe = hashMulti(encryptedMessage);
        emit MessagePublished(
            encryptedMessage,
            publisherPublicKey,
            hashedEncryptedMessaghe
        );
    }

    // Updates executionStateMT should the decryption of
    // the message is successful
    function insertMessage(
        uint256 hashedEncryptedMessage
    ) public onlyOwner {
        executionStateMT.insert(hashedEncryptedMessage);
        emit MessageInserted(hashedEncryptedMessage);
    }

    // Inserts a new user
    function insertUser(
        uint256 hashedEncryptedMessage
    ) public onlyOwner {
        uint256 userIndex = registryMT.getInsertedLeavesNo();
        registryMT.insert(hashedEncryptedMessage);
        emit UserInserted(hashedEncryptedMessage, userIndex);
    }

    // Updates user
    function updateUser(
        uint256 userIndex,
        uint256 hashedEncryptedMessage,
        uint256[] memory path
    ) public onlyOwner {
        uint256 oldHashedEncryptedMessage = registryMT.getLeafAt(userIndex);
        registryMT.update(userIndex, hashedEncryptedMessage, path);
        emit UserUpdated(
            oldHashedEncryptedMessage,
            hashedEncryptedMessage,
            userIndex
        );
    }

}