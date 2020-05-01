pragma experimental ABIEncoderV2;
pragma solidity ^0.5.0;

import { DomainObjs } from './DomainObjs.sol';
import { IncrementalMerkleTree } from "./IncrementalMerkleTree.sol";
import { SignUpGatekeeper } from "./gatekeepers/SignUpGatekeeper.sol";
import { BatchUpdateStateTreeVerifier } from "./BatchUpdateStateTreeVerifier.sol";
import { QuadVoteTallyVerifier } from "./QuadVoteTallyVerifier.sol";
import { InitialVoiceCreditProxy } from './initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';
import { SnarkConstants } from './SnarkConstants.sol';
import { ComputeRoot } from './ComputeRoot.sol';
import { Ownable } from "@openzeppelin/contracts/ownership/Ownable.sol";

contract MACI is Ownable, DomainObjs, ComputeRoot {

    // A nothing-up-my-sleeve zero value
    // Should be equal to 5503045433092194285660061905880311622788666850989422096966288514930349325741
    uint256 ZERO_VALUE = uint256(keccak256(abi.encodePacked('Maci'))) % SNARK_SCALAR_FIELD;

    // Verifier Contracts
    BatchUpdateStateTreeVerifier internal batchUstVerifier;
    QuadVoteTallyVerifier internal qvtVerifier;

    // The number of messages which the batch update state tree snark can
    // process per batch
    uint8 public messageBatchSize;

    // The number of state leaves to tally per batch via the vote tally snark
    uint8 public tallyBatchSize;

    // The current message batch index
    uint256 public currentMessageBatchIndex;

    // The tree that tracks the sign-up messages.
    IncrementalMerkleTree public messageTree;

    // The tree that tracks each user's public key and votes
    IncrementalMerkleTree public stateTree;

    // The Merkle root of the state tree after the sign-up period.
    // publishMessage() will not update the state tree. Rather, it will
    // directly update postSignUpStateRoot if given a valid proof and public
    // signals.
    uint256 public postSignUpStateRoot;

    // To store the Merkle root of a tree with 2 **
    // _treeDepths.voteOptionTreeDepth leaves of value 0
    uint256 public emptyVoteOptionTreeRoot;

    // To store hashLeftRight(Merkle root of 2 ** voteOptionTreeDepth zeros, 0)
    uint256 public currentResultsCommitment;

    // The maximum number of leaves, minus one, of meaningful vote options.
    uint256 public voteOptionsMaxLeafIndex;

    // The batch # for the quote tally function
    uint256 public currentQvtBatchNum;

    // Cached results of 2 ** depth - 1 where depth is the state tree depth and
    // message tree depth
    uint256 public messageTreeMaxLeafIndex;

    // The maximum number of signups allowed
    uint256 public maxUsers;

    // The maximum number of messages allowed
    uint256 public maxMessages;

    // When the contract was deployed. We assume that the signup period starts
    // immediately upon deployment.
    uint256 public signUpTimestamp;

    // Duration of the sign-up and voting periods, in seconds
    uint256 public signUpDurationSeconds;
    uint256 public votingDurationSeconds;

    // Address of the SignUpGatekeeper, a contract which determines whether a
    // user may sign up to vote
    SignUpGatekeeper public signUpGatekeeper;

    // The contract which provides the values of the initial voice credit
    // balance per user
    InitialVoiceCreditProxy public initialVoiceCreditProxy;

    // The coordinator's public key
    PubKey public coordinatorPubKey;

    uint256 public numSignUps = 0;
    uint256 public numMessages = 0;

    TreeDepths public treeDepths;

    // Events
    event SignUp(
        PubKey indexed _userPubKey,
        uint256 indexed _stateIndex,
        uint256 indexed _voiceCreditBalance
    );

    event PublishMessage(
        Message indexed _message,
        PubKey indexed _encPubKey
    );

    // This struct helps to reduce the number of parameters to the constructor
    // and avoid a stack overflow error during compilation
    struct TreeDepths {
        uint8 stateTreeDepth;
        uint8 messageTreeDepth;
        uint8 voteOptionTreeDepth;
    }

    struct BatchSizes {
        uint8 tallyBatchSize;
        uint8 messageBatchSize;
    }

    struct MaxValues {
        uint256 maxUsers;
        uint256 maxMessages;
        uint256 maxVoteOptions;
    }

    constructor(
        TreeDepths memory _treeDepths,
        BatchSizes memory _batchSizes,
        MaxValues memory _maxValues,
        SignUpGatekeeper _signUpGatekeeper,
        BatchUpdateStateTreeVerifier _batchUstVerifier,
        QuadVoteTallyVerifier _qvtVerifier,
        uint256 _signUpDurationSeconds,
        uint256 _votingDurationSeconds,
        InitialVoiceCreditProxy _initialVoiceCreditProxy,
        PubKey memory _coordinatorPubKey
    ) Ownable() public {

        treeDepths = _treeDepths;

        tallyBatchSize = _batchSizes.tallyBatchSize;
        messageBatchSize = _batchSizes.messageBatchSize;

        // Set the verifier contracts
        batchUstVerifier = _batchUstVerifier;
        qvtVerifier = _qvtVerifier;

        // Set the sign-up duration
        signUpTimestamp = now;
        signUpDurationSeconds = _signUpDurationSeconds;
        votingDurationSeconds = _votingDurationSeconds;
        
        // Set the sign-up gatekeeper contract
        signUpGatekeeper = _signUpGatekeeper;
        
        // Set the initial voice credit balance proxy
        initialVoiceCreditProxy = _initialVoiceCreditProxy;

        // Set the coordinator's public key
        coordinatorPubKey = _coordinatorPubKey;

        // Calculate and cache the max number of leaves for each tree.
        // They are used as public inputs to the batch update state tree snark.
        messageTreeMaxLeafIndex = uint256(2) ** _treeDepths.messageTreeDepth - 1;

        // Check and store the maximum number of signups
        // It is the user's responsibility to ensure that the state tree depth
        // is just large enough and not more, or they will waste gas.
        uint256 stateTreeMaxLeafIndex = uint256(2) ** _treeDepths.stateTreeDepth - 1;
        require(_maxValues.maxUsers <= stateTreeMaxLeafIndex, "MACI: invalid maxUsers value");
        maxUsers = _maxValues.maxUsers;

        // The maximum number of messages
        require(_maxValues.maxMessages <= messageTreeMaxLeafIndex, "MACI: invalid maxMessages value");
        maxMessages = _maxValues.maxMessages;

        // The maximum number of leaves, minus one, of meaningful vote options.
        // This allows the snark to do a no-op if the user votes for an option
        // which has no meaning attached to it
        voteOptionsMaxLeafIndex = _maxValues.maxVoteOptions;

        // Create the message tree
        messageTree = new IncrementalMerkleTree(_treeDepths.messageTreeDepth, ZERO_VALUE);

        // Calculate and store the empty vote option tree root. This value must
        // be set before we call hashedBlankStateLeaf() later
        emptyVoteOptionTreeRoot = calcEmptyVoteOptionTreeRoot(_treeDepths.voteOptionTreeDepth);

        // Calculate and store a commitment to 2 ** voteOptionTreeDepth zeros,
        // and the salt of 0.
        currentResultsCommitment = hashLeftRight(
            computeEmptyRoot(_treeDepths.voteOptionTreeDepth, 0),
            0
        );

        // Compute the hash of a blank state leaf
        uint256 h = hashedBlankStateLeaf();

        // Create the state tree
        stateTree = new IncrementalMerkleTree(_treeDepths.stateTreeDepth, h);

        // Make subsequent insertions start from leaf #1, as leaf #0 is only
        // updated with random data if a command is invalid.
        stateTree.insertLeaf(h);
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
     * Returns the deadline to vote
     */
    function calcVotingDeadline() public view returns (uint256) {
        return calcSignUpDeadline() + votingDurationSeconds;
    }

    /*
     * Ensures that the calling function only continues execution if the
     * current block time is before the voting deadline.
     */
    modifier isBeforeVotingDeadline() {
        require(now < calcVotingDeadline(), "MACI: the voting period has passed");
        _;
    }

    /*
     * Ensures that the calling function only continues execution if the
     * current block time is after or equal to the voting deadline.
     */
    modifier isAfterVotingDeadline() {
        require(now >= calcVotingDeadline(), "MACI: the voting period is not over");
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
        bytes memory _signUpGatekeeperData,
        bytes memory _initialVoiceCreditProxyData
    ) 
    isBeforeSignUpDeadline
    public {

        require(numSignUps < maxUsers, "MACI: maximum number of signups reached");

        // Register the user via the sign-up gatekeeper. This function should
        // throw if the user has already registered or if ineligible to do so.
        signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

        uint256 voiceCreditBalance = initialVoiceCreditProxy.getVoiceCredits(
            msg.sender,
            _initialVoiceCreditProxyData
        );

        // Create, hash, and insert a fresh state leaf
        StateLeaf memory stateLeaf = StateLeaf({
            pubKey: _userPubKey,
            voteOptionTreeRoot: emptyVoteOptionTreeRoot,
            voiceCreditBalance: voiceCreditBalance,
            nonce: 0
        });

        uint256 hashedLeaf = hashStateLeaf(stateLeaf);

        stateTree.insertLeaf(hashedLeaf);

        numSignUps ++;

        // numSignUps is equal to the state index of the leaf which was just
        // added to the state tree above
        emit SignUp(_userPubKey, numSignUps, voiceCreditBalance);
    }

    /*
     * Allows anyone to publish a message (an encrypted command and signature).
     * This function also inserts it into the message tree.
     * @param _userPubKey The user's desired public key.
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
    isBeforeVotingDeadline
    public {

        require(numMessages < maxMessages, "MACI: message limit reached");

        require(numSignUps > 0, "MACI: nobody signed up");

        // When this function is called for the first time, set
        // postSignUpStateRoot to the last known state root.
        // We do so as the batchProcessMessage function can only update the
        // state root as a variable and has no way to use
        // IncrementalMerkleTree.insertLeaf() anyway.
        if (postSignUpStateRoot == 0) {
            // It is exceedingly improbable that the zero value is a tree root
            assert(postSignUpStateRoot != stateTree.root());

            postSignUpStateRoot = stateTree.root();

            // This is exceedingly unlikely to occur
            assert(postSignUpStateRoot != 0);
        }

        // Calculate leaf value
        uint256 leaf = hashMessage(_message);

        // Insert the new leaf into the message tree
        messageTree.insertLeaf(leaf);

        numMessages ++;

        emit PublishMessage(_message, _encPubKey);
    }

    /*
     * A helper function to convert an array of 8 uint256 values into the a, b,
     * and c array values that the zk-SNARK verifier's verifyProof accepts.
     */
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

    /*
     * A helper function to create the publicSignals array from meaningful
     * parameters.
     * @param _newStateRoot The new state root after all messages are processed
     * @param _stateTreeRoots The intermediate state roots
     * @param _ecdhPubKeys The public key used to generated the ECDH shared key
     *                     to decrypt the message
     */
    function genBatchUstPublicSignals(
        uint256 _newStateRoot,
        uint256[] memory _stateTreeRoots,
        PubKey[] memory _ecdhPubKeys
    ) public view returns (uint256[20] memory) {

        uint256 messageBatchEndIndex;
        if (currentMessageBatchIndex + messageBatchSize <= numMessages) {
            messageBatchEndIndex = currentMessageBatchIndex + messageBatchSize - 1;
        } else {
            messageBatchEndIndex = numMessages - 1;
        }

        uint256[20] memory publicSignals;
        publicSignals[0] = _newStateRoot;
        publicSignals[1] = coordinatorPubKey.x;
        publicSignals[2] = coordinatorPubKey.y;
        publicSignals[3] = voteOptionsMaxLeafIndex;
        publicSignals[4] = messageTree.root();
        publicSignals[5] = currentMessageBatchIndex;
        publicSignals[6] = messageBatchEndIndex;
        publicSignals[7] = numSignUps;

        for (uint8 i = 0; i < messageBatchSize; i++) {
            uint8 x = 8 + i;
            uint8 y = 8 + messageBatchSize + i * 2;
            uint8 z = y + 1;
            publicSignals[x] = _stateTreeRoots[i];
            publicSignals[y] = _ecdhPubKeys[i].x;
            publicSignals[z] = _ecdhPubKeys[i].y;
        }

        return publicSignals;
    }

    function hasUnprocessedMessages() public view returns (bool) {
        return currentMessageBatchIndex < numMessages;
    }

    /*
     * Update the postSignupStateRoot if the batch update state root proof is
     * valid.
     * @param _newStateRoot The new state root after all messages are processed
     * @param _stateTreeRoots The intermediate state roots
     * @param _ecdhPubKeys The public key used to generated the ECDH shared key
     *                     to decrypt the message
     * @param _proof The zk-SNARK proof
     */
    function batchProcessMessage(
        uint256 _newStateRoot,
        uint256[] memory _stateTreeRoots,
        PubKey[] memory _ecdhPubKeys,
        uint256[8] memory _proof
    ) 
    isAfterVotingDeadline
    public {
        // Ensure that the current batch index is within range
        require(
            hasUnprocessedMessages(),
            "MACI: no more messages left to process"
        );
        
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

        // Ensure that currentMessageBatchIndex is within range
        require(
            currentMessageBatchIndex <= messageTreeMaxLeafIndex,
            "MACI: currentMessageBatchIndex not within range"
        );

        // Assemble the public inputs to the snark
        uint256[20] memory publicSignals = genBatchUstPublicSignals(
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

        // Verify the proof
        require(
            batchUstVerifier.verifyProof(a, b, c, publicSignals),
            "MACI: invalid batch UST proof"
        );

        // Increase the message batch start index to ensure that each message
        // batch is processed in order
        currentMessageBatchIndex += messageBatchSize;

        // Update the state root
        postSignUpStateRoot = _newStateRoot;
    }

    /*
     * Returns the public signals required to verify a quadratic vote tally
     * snark.
     */
    function genQvtPublicSignals(
        uint256 _intermediateStateRoot,
        uint256 _newResultsCommitment
    ) public view returns (uint256[5] memory) {

        uint256[5] memory publicSignals;

        publicSignals[0] = _newResultsCommitment;
        publicSignals[1] = postSignUpStateRoot;
        publicSignals[2] = currentQvtBatchNum;
        publicSignals[3] = _intermediateStateRoot;
        publicSignals[4] = currentResultsCommitment;

        return publicSignals;
    }
    
    function hashedBlankStateLeaf() public view returns (uint256) {
        StateLeaf memory stateLeaf = StateLeaf({
            pubKey: PubKey({
                x: 0,
                y: 0
            }),
            voteOptionTreeRoot: emptyVoteOptionTreeRoot,
            voiceCreditBalance: 0,
            nonce: 0
        });

        return hashStateLeaf(stateLeaf);
    }

    function hasUntalliedStateLeaves() public view returns (bool) {
        return currentQvtBatchNum < (1 + (numSignUps / tallyBatchSize));
    }

    /*
     * Tally the next batch of state leaves.
     * @param _intermediateStateRoot The intermediate state root, which is
     *     generated from the current batch of state leaves 
     * @param _newResultsCommitment A hash of the tallied results so far
     *     (cumulative)
     * @param _finalResults The final invocation of this function should
     *     provide this final tally
     * @param _finalSalt The salt which, when combined with _finalResults, will
     *     produce the preimage to the commitment to the final tally
     * @param _proof The zk-SNARK proof
     */
    function proveVoteTallyBatch(
        uint256 _intermediateStateRoot,
        uint256 _newResultsCommitment,
        uint256[] memory _finalResults,
        uint256 _finalSalt,
        uint256[8] memory _proof
    ) 
    public {

        require(numSignUps > 0, "MACI: nobody signed up");
        uint256 totalBatches = 1 + (numSignUps / tallyBatchSize);

        // Ensure that the batch # is within range
        require(
            currentQvtBatchNum < totalBatches,
            "MACI: all batches have already been tallied"
        );

        // If the batch # is the final batch, reveal the final tallied results
        if (currentQvtBatchNum == totalBatches - 1) {
            uint256 hashed = hashLeftRight(
                computeRoot(treeDepths.voteOptionTreeDepth, _finalResults),
                _finalSalt
            );
            require(
                _newResultsCommitment == hashed,
                "MACI: the hash of the salted final results provided does not match the commitment"
            );
        }

        // Generate the public signals
        uint256[5] memory publicSignals = genQvtPublicSignals(
            _intermediateStateRoot,
            _newResultsCommitment
        );

        // Unpack the snark proof
        (
            uint256[2] memory a,
            uint256[2][2] memory b,
            uint256[2] memory c
        ) = unpackProof(_proof);

        // Verify the proof
        bool isValid = qvtVerifier.verifyProof(a, b, c, publicSignals);

        require(isValid == true, "MACI: invalid quadratic vote tally proof");

        // Save the commitment to the new results for the next batch
        currentResultsCommitment = _newResultsCommitment;

        // Increment the batch #
        currentQvtBatchNum ++;
    }

    function calcEmptyVoteOptionTreeRoot(uint8 _levels) public pure returns (uint256) {
        return computeEmptyRoot(_levels, 0);
    }

    function hashZeros(uint256 _numZeros) public pure returns (uint256) {
        uint256[] memory zeros = new uint256[](_numZeros);
        return hash(zeros);
    }

    function getMessageTreeRoot() public view returns (uint256) {
        return messageTree.root();
    }

    function getStateTreeRoot() public view returns (uint256) {
        return stateTree.root();
    }
}
