pragma solidity ^0.5.0;

import "./Verifier.sol";
import "./MerkleTree.sol";
import "./Ownable.sol";

contract MACI is Verifier, MerkleTree, Ownable {
    // The external_nullifier helps to prevent double-signalling by the same
    // user.
    uint256 public externalNullifier;

    // Whether broadcastSignal() can only be called by the owner of this
    // contract. This is the case as a safe default.
    bool public isBroadcastPermissioned = true;

    // Whether the contract has already seen a particular Merkle tree root
    mapping (uint256 => bool) rootHistory;

    // Whether the contract has already seen a particular nullifier hash
    mapping (uint => bool) nullifierHashHistory;

    // All signals broadcasted
    mapping (uint => bytes) public signals;

    // The higest index of the `signals` mapping
    uint public currentSignalIndex = 0;

    event SignalBroadcast(bytes signal, uint256 nullifiers_hash, uint256 external_nullifier);

    /*
     * If broadcastSignal is permissioned, check if msg.sender is the contract owner
     */
    modifier onlyOwnerIfPermissioned() {
        require(!isBroadcastPermissioned || isOwner(), "MACI: broadcast permission denied");
        _;
    }

    constructor(uint8 treeLevels, uint256 zeroValue, uint256 _externalNullifier) Ownable() public {
        externalNullifier = _externalNullifier;
        initTree(treeLevels, zeroValue);
    }


    /*
     * Register a new user.
     * @param identity_commitment The user's identity commitment, which is the
     *                            hash of their public key and their identity
     *                            nullifier (a random 31-byte value)
     */
    function insertIdentity(uint256 identity_commitment) public onlyOwner {
        insert(identity_commitment);
        rootHistory[treeRoot] = true;
    }

    /*
     * Change a user's identity commitment.
     * @param old_leaf The user's original identity commitment
     * @param leaf The user's new identity commitment
     * @param leaf_index The index of the original identity commitment in the tree
     * @param old_path The Merkle path to the original identity commitment
     * @param path The Merkle path to the new identity commitment
     */
    function updateIdentity(
        uint32 leaf_index,
        uint256 leaf,
        uint256[] memory path
    ) public onlyOwner {
        update(leaf_index, leaf, path);
        rootHistory[treeRoot] = true;
    }

    /*
     * @param n The nulllifier hash to check
     * @return True if the nullifier hash has previously been stored in the
     *         contract
     */
    function hasNullifier(uint n) public view returns (bool) {
        return nullifierHashHistory[n];
    }

    /*
     * @param The Merkle root to check
     * @return True if the root has previously been stored in the
     *         contract
     */
    function isInRootHistory(uint n) public view returns (bool) {
        return rootHistory[n];
    }

    /*
     * A convenience view function which helps operators to easily verify all
     * inputs to broadcastSignal() using a single contract call. This helps
     * them to save gas by detecting invalid inputs before they invoke
     * broadcastSignal(). Note that this function does the same checks as
     * `isValidSignalAndProof` but returns a bool instead of using require()
     * statements.
     */
    function preBroadcastCheck (
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[12] memory input,
        uint256 signal_hash
    ) public view returns (bool) {
        return hasNullifier(input[1]) == false &&
            signal_hash == input[2] &&
            externalNullifier == input[3] &&
            isInRootHistory(input[0]) &&
            verifyProof(a, b, c, input);
    }

    /*
     * A modifier which ensures that the signal and proof are valid.
     * @param signal The signal to broadcast
     * @param a The corresponding `a` parameter to verifier.sol's verifyProof()
     * @param b The corresponding `b` parameter to verifier.sol's verifyProof()
     * @param c The corresponding `c` parameter to verifier.sol's verifyProof()
     * @param input The public inputs to the zk-SNARK
     */
    modifier isValidSignalAndProof (
        bytes memory signal,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[12] memory input
    ) {
        // Hash the signal
        uint256 signal_hash = uint256(keccak256(signal)) >> 8;

        require(hasNullifier(input[1]) == false, "Semaphore: nullifier already seen");
        require(signal_hash == input[2], "Semaphore: signal hash mismatch");
        require(externalNullifier == input[3], "Semaphore: external nullifier mismatch");
        require(isInRootHistory(input[0]), "Semaphore: root not seen");
        require(verifyProof(a, b, c, input), "Semaphore: invalid proof");
        _;
    }

    /*
     * Broadcast the signal.
     * @param signal The signal to broadcast
     * @param a The corresponding `a` parameter to verifier.sol's verifyProof()
     * @param b The corresponding `b` parameter to verifier.sol's verifyProof()
     * @param c The corresponding `c` parameter to verifier.sol's verifyProof()
     * @param input The public inputs to the zk-SNARK
     */
    function broadcastSignal(
        bytes memory signal,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[12] memory input // (root, nullifiers_hash, signal_hash, external_nullifier)
    ) public
    onlyOwnerIfPermissioned
    isValidSignalAndProof(signal, a, b, c, input)
    {
        uint nullifiers_hash = input[1];
        signals[currentSignalIndex++] = signal;
        nullifierHashHistory[nullifiers_hash] = true;
        emit SignalBroadcast(signal, nullifiers_hash, externalNullifier);
    }

    /*
     * @param tree_index The tree in question
     * @return The Merkle root
     */
    function root() public view returns (uint256) {
      return treeRoot;
    }

    /*
     * @param tree_index The tree in question
     * @return The leaves of the tree
     */
    function leaves() public view returns (uint256[] memory) {
      return treeLeaves;
    }

    /*
     * @param tree_index The tree in question
     * @param leaf_index The index of the leaf to fetch
     * @return The leaf at leaf_index of the tree with index tree_index
     */
    function leaf(uint256 leafIndex) public view returns (uint256) {
      return treeLeaves[leafIndex];
    }

    /*
     * Sets a new external nullifier for the contract. Only the owner can do this.
     * @param new_external_nullifier The new external nullifier to set
     */
    function setExternalNullifier(uint256 _externalNullifier) public onlyOwner {
      externalNullifier = _externalNullifier;
    }

    /*
     * Sets the `is_broadcast_permissioned` storage variable, which determines
     * whether broadcastSignal can or cannot be called by only the contract
     * owner.
     */
    function setPermissioning(bool _newPermission) public onlyOwner {
      isBroadcastPermissioned = _newPermission;
    }
}