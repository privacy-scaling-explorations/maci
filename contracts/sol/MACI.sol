pragma experimental ABIEncoderV2;
pragma solidity ^0.5.0;

import { DomainObjs } from './DomainObjs.sol';
import { MerkleTree } from "./MerkleTree.sol";
import { SignUpGatekeeper } from "./gatekeepers/SignUpGatekeeper.sol";
import { BatchUpdateStateTreeVerifier } from "./BatchUpdateStateTreeVerifier.sol";
import { QuadVoteTallyVerifier } from "./QuadVoteTallyVerifier.sol";

import { Ownable } from "@openzeppelin/contracts/ownership/Ownable.sol";

contract MACI is Ownable, DomainObjs {

    // TODO: store these values in a Constants.sol
    uint256 SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    // A nothing up my sleeve zero value
    // Should be equal to 5503045433092194285660061905880311622788666850989422096966288514930349325741
    uint256 ZERO_VALUE = uint256(keccak256(abi.encodePacked('Maci'))) % SNARK_SCALAR_FIELD;

    // Verifier Contracts
    BatchUpdateStateTreeVerifier internal batchUstVerifier;
    QuadVoteTallyVerifier internal qvtVerifier;

    uint8 internal messageBatchSize;
    uint256 internal messageBatchStartIndex = 0;

    // TODO: remove the update function if it isn't used
    MerkleTree public messageTree;

    // The state tree that tracks the sign-up messages.
    MerkleTree public stateTree;

    // The Merkle root of the state tree after the sign-up period.
    // publishMessage() will not update the state tree. Rather, it will
    // directly update postSignUpStateRoot if given a valid proof and public
    // signals.
    uint256 public postSignUpStateRoot;

    uint256 public emptyVoteOptionTreeRoot;
    uint256 internal voteOptionsMaxLeafIndex;
    uint256 internal stateTreeMaxLeafIndex;
    uint256 internal messageTreeMaxLeafIndex;

    // When the contract was deployed. We assume that the signup period starts
    // immediately upon deployment.
    uint256 public signUpTimestamp;

    // Duration of the sign-up period, in seconds
    uint256 public signUpDurationSeconds;

    // Address of the SignUpGatekeeper, a contract which determines whether a
    // user may sign up to vote
    SignUpGatekeeper public signUpGatekeeper;

    // The initial voice credit balance per user
    uint256 public initialVoiceCreditBalance;

    // The coordinator's public key
    PubKey public coordinatorPubKey;

    // Events
    event SignUp(PubKey indexed _userPubKey);

    event PublishMessage(
        Message indexed _message,
        PubKey indexed _encPubKey
    );

    constructor(
        uint8 _messageBatchSize,
        uint8 _messageTreeDepth,
        uint8 _stateTreeDepth,
        uint8 _voteOptionTreeDepth,
        SignUpGatekeeper _signUpGatekeeper,
        BatchUpdateStateTreeVerifier _batchUstVerifier,
        QuadVoteTallyVerifier _qvtVerifier,
        uint256 _signUpDurationSeconds,
        uint256 _initialVoiceCreditBalance,
        PubKey memory _coordinatorPubKey
    ) Ownable() public {

        messageBatchSize = _messageBatchSize;

        // Set the verifier contracts
        batchUstVerifier = _batchUstVerifier;
        qvtVerifier = _qvtVerifier;

        // Set the sign-up duration
        signUpTimestamp = now;
        signUpDurationSeconds = _signUpDurationSeconds;
        
        // Set the sign-up gatekeeper contract
        signUpGatekeeper = _signUpGatekeeper;
        
        // Set the initial voice credit balance
        initialVoiceCreditBalance = _initialVoiceCreditBalance;

        // Set the coordinator's public key
        coordinatorPubKey = _coordinatorPubKey;

        // Create the message tree
        messageTree = new MerkleTree(_messageTreeDepth, ZERO_VALUE);

        // Create the state tree
        stateTree = new MerkleTree(_stateTreeDepth, ZERO_VALUE);

        // Calculate the vote option tree root. If its depth is the same as
        // that of anothet tree, re-use the root.
        if (_voteOptionTreeDepth == _messageTreeDepth) {
            emptyVoteOptionTreeRoot = messageTree.getRoot();
        } else if (_voteOptionTreeDepth == _stateTreeDepth) {
            emptyVoteOptionTreeRoot = stateTree.getRoot();
        } else {
            // TODO: should the zero value for the vote option tree be just 0
            // instead of the nothing-up-my sleeve value? After all, each leaf
            // is the square root of the voice credits spent for the option.
            MerkleTree tempTree = new MerkleTree(_voteOptionTreeDepth, ZERO_VALUE);
            emptyVoteOptionTreeRoot = tempTree.getRoot();
        }

        // Calculate and cache the max number of leaves for each tree.
        // They are used as public inputs to the batch update state tree snark.
        voteOptionsMaxLeafIndex = uint256(2) ** _voteOptionTreeDepth;
        messageTreeMaxLeafIndex = uint256(2) ** _messageTreeDepth;
        stateTreeMaxLeafIndex = uint256(2) ** _stateTreeDepth;

        // Make subsequent insertions start from leaf #1, as leaf #0 is only
        // updated with random data if a command is invalid.
        stateTree.insertBlankAtZerothLeaf();
    }

    /*
     * Returns the deadline to sign up.
     */
    function calcSignUpDeadline() public view returns (uint256) {
        return signUpTimestamp + signUpDurationSeconds;
    }

    /*
     * Ensures that the calling function only continues execution if the
     * current block time is before the sign-up deadline.
     */
    modifier isBeforeSignUpDeadline() {
        require(now < calcSignUpDeadline(), "MACI: the sign-up period has passed");
        _;
    }

    /*
     * Ensures that the calling function only continues execution if the
     * current block time is after or equal to the sign-up deadline.
     */
    modifier isAfterSignUpDeadline() {
        require(now >= calcSignUpDeadline(), "MACI: the sign-up period is not over");
        _;
    }

    /*
     * Allows a user who is eligible to sign up to do so. The sign-up
     * gatekeeper will prevent double sign-ups or ineligible users from signing
     * up. This function will only succeed if the sign-up deadline has not
     * passed. It also inserts a fresh state leaf into the state tree.
     * @param _userPubKey The user's desired public key.
     * @param _signUpGatekeeperData Data to pass to the sign-up gatekeeper's
     *     register() function. For instance, the POAPGatekeeper or
     *     SignUpTokenGatekeeper requires this value to be the ABI-encoded
     *     token ID.
     */
    function signUp(
        PubKey memory _userPubKey,
        bytes memory _signUpGatekeeperData
    ) 
    isBeforeSignUpDeadline
    public {

        // Register the user via the sign-up gatekeeper. This function should
        // throw if the user has already registered or if ineligible to do so.
        signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

        // Create, hash, and insert a fresh state leaf
        StateLeaf memory stateLeaf = StateLeaf({
            pubKey: _userPubKey,
            voteOptionTreeRoot: emptyVoteOptionTreeRoot,
            voiceCreditBalance: initialVoiceCreditBalance,
            nonce: 0
        });

        uint256 hashedLeaf = hashStateLeaf(stateLeaf);

        stateTree.insert(hashedLeaf);

        emit SignUp(_userPubKey);
    }

    /*
     * Allows anyone to publish a message (an encrypted command and signature).
     * This function also inserts it into the message tree.  @param _userPubKey
     * The user's desired public key.
     * @param _message The message to publish
     * @param _encPubKey An epheremal public key which can be combined with the
     *     coordinator's private key to generate an ECDH shared key which which was
     *     used to encrypt the message.
     */
    function publishMessage(
        Message memory _message,
        PubKey memory _encPubKey
    ) 
    isAfterSignUpDeadline
    public {

        // When this function is called for the first time, set
        // postSignUpStateRoot to the last known state root, and destroy the
        // state tree contract to free up space. We do so as the
        // batchProcessMessage function can only update the state root as a
        // variable and has no way to use MerkleTree.insert() anyway.
        if (postSignUpStateRoot == 0) {
            // It is exceedingly improbable that the zero value is a tree root
            assert(postSignUpStateRoot != stateTree.getRoot());

            postSignUpStateRoot = stateTree.getRoot();

            // This is exceedingly unlikely to occur
            assert(postSignUpStateRoot != 0);

            // Destroy the state tree contract
            stateTree.selfDestruct();
        }

        // Calculate leaf value
        uint256 leaf = hashMessage(_message);

        // Insert the new leaf into the message tree
        messageTree.insert(leaf);

        emit PublishMessage(_message, _encPubKey);
    }

    function unpackProof(
        uint256[8] memory _proof
    ) public pure returns (
        uint256[2] memory,
        uint256[2][2] memory,
        uint256[2] memory
    ) {

        return (
            [_proof[0], _proof[1]],
            [
                [_proof[2], _proof[3]],
                [_proof[4], _proof[5]]
            ],
            [_proof[6], _proof[7]]
        );
    }

    function genBatchUstPublicSignals(
        uint256 _newStateRoot,
        uint256[] memory _stateTreeRoots,
        PubKey[] memory _ecdhPubKeys
    ) internal view returns (uint256[19] memory) {
        uint256[19] memory publicSignals;
        publicSignals[0] = _newStateRoot;
        publicSignals[1] = coordinatorPubKey.x;
        publicSignals[2] = coordinatorPubKey.y;
        publicSignals[3] = voteOptionsMaxLeafIndex;
        publicSignals[4] = messageTree.getRoot();
        publicSignals[5] = messageBatchStartIndex;
        publicSignals[6] = stateTreeMaxLeafIndex;

        for (uint8 i = 0; i < messageBatchSize; i++) {
            uint8 x = 7 + i;
            uint8 y = 7 + messageBatchSize + i * 2;
            uint8 z = y + 1;
            publicSignals[x] = _stateTreeRoots[i];
            publicSignals[y] = _ecdhPubKeys[i].x;
            publicSignals[z] = _ecdhPubKeys[i].y;
        }

        return publicSignals;
    }

    function batchProcessMessage(
        uint256 _newStateRoot,
        uint256[] memory _stateTreeRoots,
        PubKey[] memory _ecdhPubKeys,
        uint256[8] memory _proof
    ) public {
        
        // Ensure that the array of state tree roots and the array of ECDH
        // public keys are of the correct length
        require(
            _stateTreeRoots.length == messageBatchSize,
            "MACI: incorrect _stateTreeRoots length"
        );

        require(
            _ecdhPubKeys.length == messageBatchSize,
            "MACI: incorrect _ecdhPubKeys length"
        );

        // Ensure that messageBatchStartIndex is within range
        require(
            messageBatchStartIndex <= messageTreeMaxLeafIndex - messageBatchSize,
            "MACI: messageBatchStartIndex not within range"
        );

        // Assemble the public inputs to the snark
        uint256[19] memory publicSignals = genBatchUstPublicSignals(
            _newStateRoot,
            _stateTreeRoots,
            _ecdhPubKeys
        );

        // Ensure that each public input is within range of the snark scalar
        // field.
        // TODO: consider having more granular revert reasons
        for (uint8 i=0; i < publicSignals.length; i++) {
            require(
                publicSignals[i] < SNARK_SCALAR_FIELD,
                "MACI: each public signal must be lt the snark scalar field"
            );
        }

        // Unpack the snark proof
        (
            uint256[2] memory a,
            uint256[2][2] memory b,
            uint256[2] memory c
        ) = unpackProof(_proof);

        bool isValid = batchUstVerifier.verifyProof(a, b, c, publicSignals);

        require(isValid == true, "MACI: invalid batch UST proof");

        // Increase the message batch start index to ensure that each message
        // batch is processed in order
        messageBatchStartIndex += messageBatchSize;

        // The message batch start index should never exceed the maximum allowed value
        assert(messageBatchStartIndex <= messageTreeMaxLeafIndex - messageBatchSize);

        // Update the state root
        postSignUpStateRoot = _newStateRoot;
    }

    function getMessageTreeRoot() public view returns (uint256) {
        return messageTree.getRoot();
    }

    function getStateTreeRoot() public view returns (uint256) {
        return stateTree.getRoot();
    }
}
