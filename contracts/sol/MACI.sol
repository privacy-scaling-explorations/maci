// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.6.12;

import { DomainObjs } from './DomainObjs.sol';
import { IncrementalQuinTree } from "./IncrementalQuinTree.sol";
import { IncrementalMerkleTree, PreCalcIncrementalMerkleTree } from "./IncrementalMerkleTree.sol";
import { SignUpGatekeeper } from "./gatekeepers/SignUpGatekeeper.sol";
import { InitialVoiceCreditProxy } from './initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';
import { SnarkConstants } from './SnarkConstants.sol';
import { ComputeRoot } from './ComputeRoot.sol';
import { MACIParameters } from './MACIParameters.sol';
import { VerifyTally } from './VerifyTally.sol';

interface SnarkVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata input
    ) external view returns (bool);
}

contract MACI is DomainObjs, ComputeRoot, MACIParameters, VerifyTally {

    // A nothing-up-my-sleeve zero value
    // Should be equal to 8370432830353022751713833565135785980866757267633941821328460903436894336785
    uint256 ZERO_VALUE = uint256(keccak256(abi.encodePacked('Maci'))) % SNARK_SCALAR_FIELD;

    // Verifier Contracts
    SnarkVerifier internal batchUstVerifier;
    SnarkVerifier internal qvtVerifier;

    // The number of messages which the batch update state tree snark can
    // process per batch
    uint8 public messageBatchSize;

    // The number of state leaves to tally per batch via the vote tally snark
    uint8 public tallyBatchSize;

    // The tree that tracks the sign-up messages.
    PreCalcIncrementalMerkleTree public messageTree;

    // The tree that tracks each user's public key and votes
    IncrementalMerkleTree public stateTree;

    uint256 public originalSpentVoiceCreditsCommitment = hashLeftRight(0, 0);
    uint256 public originalCurrentResultsCommitment;

    // To store the Merkle root of a tree with 5 **
    // _treeDepths.voteOptionTreeDepth leaves of value 0
    uint256 public emptyVoteOptionTreeRoot;

    // The maximum number of leaves, minus one, of meaningful vote options.
    uint256 public voteOptionsMaxLeafIndex;

    // The total sum of votes
    uint256 public totalVotes;

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

    // Duration of the sign-up and voting periods, in seconds. If these values
    // are set to 0, the contract will be in debug mode - that is, only the
    // coordinator may sign up and publish messages. This makes it possible to
    // submit a large number of signups and messages without having to do so
    // before the signup and voting deadlines.
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

    bool public hasUnprocessedMessages = true;

    address public coordinatorAddress;

    //----------------------
    // Storage variables that can be reset by coordinatorReset()

    // The Merkle root of the state tree after each signup. Note that
    // batchProcessMessage() will not update the state tree. Rather, it will
    // directly update stateRoot if given a valid proof and public signals.
    uint256 public stateRoot;
    uint256 public stateRootBeforeProcessing;

    // The current message batch index
    uint256 public currentMessageBatchIndex;

    // The batch # for proveVoteTallyBatch
    uint256 public currentQvtBatchNum;

    // To store hashLeftRight(Merkle root of 5 ** voteOptionTreeDepth zeros, 0)
    uint256 public currentResultsCommitment;

    // To store hashLeftRight(0, 0). We precompute it here to save gas.
    uint256 public currentSpentVoiceCreditsCommitment;

    // To store hashLeftRight(Merkle root of 5 ** voteOptionTreeDepth zeros, 0)
    uint256 public currentPerVOSpentVoiceCreditsCommitment;
    //----------------------


    string constant ERROR_PUBLIC_SIGNAL_TOO_LARGE = "E01";
    string constant ERROR_INVALID_BATCH_UST_PROOF = "E02";
    string constant ERROR_INVALID_TALLY_PROOF = "E03";
    string constant ERROR_ONLY_COORDINATOR = "E04";
    string constant ERROR_ALL_BATCHES_TALLIED = "E05";
    string constant ERROR_CURRENT_MESSAGE_BATCH_OUT_OF_RANGE = "E06";
    string constant ERROR_NO_SIGNUPS = "E07";
    string constant ERROR_INVALID_ECDH_PUBKEYS_LENGTH = "E08";
    string constant ERROR_NO_MORE_MESSAGES = "E09";
    string constant ERROR_INVALID_MAX_USERS_OR_MESSAGES = "E10";
    string constant ERROR_SIGNUP_PERIOD_PASSED = "E11";
    string constant ERROR_SIGNUP_PERIOD_NOT_OVER = "E12";
    string constant ERROR_VOTING_PERIOD_PASSED = "E13";
    string constant ERROR_VOTING_PERIOD_NOT_OVER = "E13";

    // Events
    event SignUp(
        PubKey _userPubKey,
        uint256 _stateIndex,
        uint256 _voiceCreditBalance
    );

    event PublishMessage(
        Message _message,
        PubKey _encPubKey
    );

    constructor(
        TreeDepths memory _treeDepths,
        BatchSizes memory _batchSizes,
        MaxValues memory _maxValues,
        SignUpGatekeeper _signUpGatekeeper,
        SnarkVerifier _batchUstVerifier,
        SnarkVerifier _qvtVerifier,
        uint256 _signUpDurationSeconds,
        uint256 _votingDurationSeconds,
        InitialVoiceCreditProxy _initialVoiceCreditProxy,
        PubKey memory _coordinatorPubKey,
        address _coordinatorAddress
    ) public {
        coordinatorAddress = _coordinatorAddress;

        treeDepths = _treeDepths;

        tallyBatchSize = _batchSizes.tallyBatchSize;
        messageBatchSize = _batchSizes.messageBatchSize;

        // Set the verifier contracts
        batchUstVerifier = _batchUstVerifier;
        qvtVerifier = _qvtVerifier;

        // Set the sign-up duration
        signUpTimestamp = block.timestamp;
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
        maxUsers = _maxValues.maxUsers;

        // The maximum number of messages
        require(
            _maxValues.maxUsers <= stateTreeMaxLeafIndex ||
            _maxValues.maxMessages <= messageTreeMaxLeafIndex,
            ERROR_INVALID_MAX_USERS_OR_MESSAGES
        );
        maxMessages = _maxValues.maxMessages;

        // The maximum number of leaves, minus one, of meaningful vote options.
        // This allows the snark to do a no-op if the user votes for an option
        // which has no meaning attached to it
        voteOptionsMaxLeafIndex = _maxValues.maxVoteOptions;

        // Create the message tree
        messageTree = new PreCalcIncrementalMerkleTree(_treeDepths.messageTreeDepth, ZERO_VALUE);

        // Calculate and store the empty vote option tree root. This value must
        // be set before we call hashedBlankStateLeaf() later
        emptyVoteOptionTreeRoot = calcEmptyVoteOptionTreeRoot(_treeDepths.voteOptionTreeDepth);

        // Calculate and store a commitment to 5 ** voteOptionTreeDepth zeros,
        // and a salt of 0.
        originalCurrentResultsCommitment = hashLeftRight(emptyVoteOptionTreeRoot, 0);

        currentResultsCommitment = originalCurrentResultsCommitment;

        currentSpentVoiceCreditsCommitment = originalSpentVoiceCreditsCommitment;
        currentPerVOSpentVoiceCreditsCommitment = originalCurrentResultsCommitment;

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
        if (signUpDurationSeconds != 0) {
            require(block.timestamp < calcSignUpDeadline(), ERROR_SIGNUP_PERIOD_PASSED);
        }
        _;
    }

    /*
     * Ensures that the calling function only continues execution if the
     * current block time is after or equal to the sign-up deadline.
     */
    modifier isAfterSignUpDeadline() {
        if (signUpDurationSeconds != 0) {
            require(block.timestamp >= calcSignUpDeadline(), ERROR_SIGNUP_PERIOD_NOT_OVER);
        }
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
        if (votingDurationSeconds != 0) {
            require(block.timestamp < calcVotingDeadline(), ERROR_VOTING_PERIOD_PASSED);
        }
        _;
    }

    /*
     * Ensures that the calling function only continues execution if the
     * current block time is after or equal to the voting deadline.
     */
    modifier isAfterVotingDeadline() {
        if (votingDurationSeconds != 0) {
            require(block.timestamp >= calcVotingDeadline(), ERROR_VOTING_PERIOD_NOT_OVER);
        }
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

        if (signUpDurationSeconds == 0) {
            require(
                msg.sender == coordinatorAddress,
                "MACI: only the coordinator can submit signups in debug mode"
            );
        }

        require(numSignUps < maxUsers, "MACI: maximum number of signups reached");

        // Register the user via the sign-up gatekeeper. This function should
        // throw if the user has already registered or if ineligible to do so.
        signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

        uint256 voiceCreditBalance = initialVoiceCreditProxy.getVoiceCredits(
            msg.sender,
            _initialVoiceCreditProxyData
        );

        // The limit on voice credits is 2 ^ 32 which is hardcoded into the
        // UpdateStateTree circuit, specifically at check that there are
        // sufficient voice credits (using GreaterEqThan(32)).
        require(voiceCreditBalance <= 4294967296, "MACI: too many voice credits");

        // Create, hash, and insert a fresh state leaf
        StateLeaf memory stateLeaf = StateLeaf({
            pubKey: _userPubKey,
            voteOptionTreeRoot: emptyVoteOptionTreeRoot,
            voiceCreditBalance: voiceCreditBalance,
            nonce: 0
        });

        uint256 hashedLeaf = hashStateLeaf(stateLeaf);

        // Insert the leaf
        stateTree.insertLeaf(hashedLeaf);

        // Update a copy of the state tree root
        stateRoot = getStateTreeRoot();

        numSignUps ++;

        // numSignUps is equal to the state index of the leaf which was just
        // added to the state tree above
        emit SignUp(_userPubKey, numSignUps, voiceCreditBalance);
    }

    /*
     * Allows anyone to publish a message (an encrypted command and signature).
     * This function also inserts it into the message tree.
     * @param _message The message to publish
     * @param _encPubKey An epheremal public key which can be combined with the
     *     coordinator's private key to generate an ECDH shared key which which was
     *     used to encrypt the message.
     */
    function publishMessage(
        Message memory _message,
        PubKey memory _encPubKey
    ) 
    isBeforeVotingDeadline
    public {
        if (signUpDurationSeconds == 0) {
            require(
                msg.sender == coordinatorAddress,
                "MACI: only the coordinator can publish messages in debug mode"
            );
        }

        require(numMessages < maxMessages, "MACI: message limit reached");

        // Calculate leaf value
        uint256 leaf = hashMessage(_message);

        // Insert the new leaf into the message tree
        messageTree.insertLeaf(leaf);

        currentMessageBatchIndex = (numMessages / messageBatchSize) * messageBatchSize;

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
     * @param _ecdhPubKeys The public key used to generated the ECDH shared key
     *                     to decrypt the message
     */
    function genBatchUstPublicSignals(
        uint256 _newStateRoot,
        PubKey[] memory _ecdhPubKeys
    ) public view returns (uint256[] memory) {

        uint256 messageBatchEndIndex;
        if (currentMessageBatchIndex + messageBatchSize <= numMessages) {
            messageBatchEndIndex = currentMessageBatchIndex + messageBatchSize - 1;
        } else {
            messageBatchEndIndex = numMessages - 1;
        }

        uint256[] memory publicSignals = new uint256[](12 + messageBatchSize * 3);

        publicSignals[0] = _newStateRoot;
        publicSignals[1] = coordinatorPubKey.x;
        publicSignals[2] = coordinatorPubKey.y;
        publicSignals[3] = voteOptionsMaxLeafIndex;
        publicSignals[4] = messageTree.root();
        publicSignals[5] = currentMessageBatchIndex;
        publicSignals[6] = messageBatchEndIndex;
        publicSignals[7] = numSignUps;


        for (uint8 i = 0; i < messageBatchSize; i++) {
            uint8 x = 8 + i * 2;
            uint8 y = x + 1;
            publicSignals[x] = _ecdhPubKeys[i].x;
            publicSignals[y] = _ecdhPubKeys[i].y;
        }

        return publicSignals;
    }

    /*
     * Update the stateRoot if the batch update state root proof is
     * valid.
     * @param _newStateRoot The new state root after all messages are processed
     * @param _ecdhPubKeys The public key used to generated the ECDH shared key
     *                     to decrypt the message
     * @param _proof The zk-SNARK proof
     */
    function batchProcessMessage(
        uint256 _newStateRoot,
        PubKey[] memory _ecdhPubKeys,
        uint256[8] memory _proof
    ) 
    isAfterVotingDeadline
    public {
        // Ensure that the current batch index is within range
        require(
            hasUnprocessedMessages,
            ERROR_NO_MORE_MESSAGES
        );
        
        require(
            _ecdhPubKeys.length == messageBatchSize,
            ERROR_INVALID_ECDH_PUBKEYS_LENGTH
        );

        // Ensure that currentMessageBatchIndex is within range
        require(
            currentMessageBatchIndex <= messageTreeMaxLeafIndex,
            ERROR_CURRENT_MESSAGE_BATCH_OUT_OF_RANGE
        );

        // Assemble the public inputs to the snark
        uint256[] memory publicSignals = genBatchUstPublicSignals(
            _newStateRoot,
            _ecdhPubKeys
        );

        // Ensure that each public input is within range of the snark scalar
        // field.
        // TODO: consider having more granular revert reasons
        // TODO: this check is already performed in the verifier contract
        for (uint8 i = 0; i < publicSignals.length; i++) {
            require(
                publicSignals[i] < SNARK_SCALAR_FIELD,
                ERROR_PUBLIC_SIGNAL_TOO_LARGE
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
            ERROR_INVALID_BATCH_UST_PROOF
        );

        // Increase the message batch start index to ensure that each message
        // batch is processed in order
        if (currentMessageBatchIndex == 0) {
            hasUnprocessedMessages = false;
        } else {
            currentMessageBatchIndex -= messageBatchSize;
        }

        // Update the state root
        stateRoot = _newStateRoot;
        if (stateRootBeforeProcessing == 0) {
            stateRootBeforeProcessing = stateRoot;
        }
    }

    /*
     * Returns the public signals required to verify a quadratic vote tally
     * snark.
     */
    function genQvtPublicSignals(
        uint256 _intermediateStateRoot,
        uint256 _newResultsCommitment,
        uint256 _newSpentVoiceCreditsCommitment,
        uint256 _newPerVOSpentVoiceCreditsCommitment,
        uint256 _totalVotes
    ) public view returns (uint256[] memory) {

        uint256[] memory publicSignals = new uint256[](10);

        publicSignals[0] = _newResultsCommitment;
        publicSignals[1] = _newSpentVoiceCreditsCommitment;
        publicSignals[2] = _newPerVOSpentVoiceCreditsCommitment;
        publicSignals[3] = _totalVotes;
        publicSignals[4] = stateRoot;
        publicSignals[5] = currentQvtBatchNum;
        publicSignals[6] = _intermediateStateRoot;
        publicSignals[7] = currentResultsCommitment;
        publicSignals[8] = currentSpentVoiceCreditsCommitment;
        publicSignals[9] = currentPerVOSpentVoiceCreditsCommitment;

        return publicSignals;
    }
    
    function hashedBlankStateLeaf() public view returns (uint256) {
        // The pubkey is the first Pedersen base point from iden3's circomlib
        StateLeaf memory stateLeaf = StateLeaf({
            pubKey: PubKey({
                x: 10457101036533406547632367118273992217979173478358440826365724437999023779287,
                y: 19824078218392094440610104313265183977899662750282163392862422243483260492317
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
     * @param _proof The zk-SNARK proof
     */
    function proveVoteTallyBatch(
        uint256 _intermediateStateRoot,
        uint256 _newResultsCommitment,
        uint256 _newSpentVoiceCreditsCommitment,
        uint256 _newPerVOSpentVoiceCreditsCommitment,
        uint256 _totalVotes,
        uint256[8] memory _proof
    ) 
    public {

        require(numSignUps > 0, ERROR_NO_SIGNUPS);
        uint256 totalBatches = 1 + (numSignUps / tallyBatchSize);

        // Ensure that the batch # is within range
        require(
            currentQvtBatchNum < totalBatches,
            ERROR_ALL_BATCHES_TALLIED
        );

        // Generate the public signals
        // public 'input' signals = [output signals, public inputs]
        uint256[] memory publicSignals = genQvtPublicSignals(
            _intermediateStateRoot,
            _newResultsCommitment,
            _newSpentVoiceCreditsCommitment,
            _newPerVOSpentVoiceCreditsCommitment,
            _totalVotes
        );

        // Ensure that each public input is within range of the snark scalar
        // field.
        // TODO: consider having more granular revert reasons
        for (uint8 i = 0; i < publicSignals.length; i++) {
            require(
                publicSignals[i] < SNARK_SCALAR_FIELD,
                ERROR_PUBLIC_SIGNAL_TOO_LARGE
            );
        }

        // Unpack the snark proof
        (
            uint256[2] memory a,
            uint256[2][2] memory b,
            uint256[2] memory c
        ) = unpackProof(_proof);

        // Verify the proof
        bool isValid = qvtVerifier.verifyProof(a, b, c, publicSignals);

        require(isValid == true, ERROR_INVALID_TALLY_PROOF);

        // Save the commitment to the new results for the next batch
        currentResultsCommitment = _newResultsCommitment;

        // Save the commitment to the total spent voice credits for the next batch
        currentSpentVoiceCreditsCommitment = _newSpentVoiceCreditsCommitment;

        // Save the commitment to the per voice credit spent voice credits for the next batch
        currentPerVOSpentVoiceCreditsCommitment = _newPerVOSpentVoiceCreditsCommitment;

        // Save the total votes
        totalVotes = _totalVotes;

        // Increment the batch #
        currentQvtBatchNum ++;
    }

    /*
     * Reset the storage variables which change during message processing and
     * vote tallying. Does not affect any signups or messages. This is useful
     * if the client-side process/tally code has a bug that causes an invalid
     * state transition.
     */
    function coordinatorReset() public {
        require(msg.sender == coordinatorAddress, ERROR_ONLY_COORDINATOR);

        hasUnprocessedMessages = true;
        stateRoot = stateRootBeforeProcessing;
        if (numMessages % messageBatchSize == 0) {
            currentMessageBatchIndex = numMessages - messageBatchSize;
        } else {
            currentMessageBatchIndex = (numMessages / messageBatchSize) * messageBatchSize;
        }
        currentQvtBatchNum = 0;

        currentResultsCommitment = originalCurrentResultsCommitment;
        currentSpentVoiceCreditsCommitment = originalSpentVoiceCreditsCommitment;
        currentPerVOSpentVoiceCreditsCommitment = originalCurrentResultsCommitment;

        totalVotes = 0;
    }

    /*
     * Verify the result of the vote tally using a Merkle proof and the salt.
     */
    function verifyTallyResult(
        uint8 _depth,
        uint256 _index,
        uint256 _leaf,
        uint256[][] memory _pathElements,
        uint256 _salt
    ) public view returns (bool) {
        uint256 computedRoot = computeMerkleRootFromPath(
            _depth,
            _index,
            _leaf,
            _pathElements
        );

        uint256 computedCommitment = hashLeftRight(computedRoot, _salt);
        return computedCommitment == currentResultsCommitment;
    }

    /*
     * Verify the number of voice credits spent for a particular vote option
     * using a Merkle proof and the salt.
     */
    function verifyPerVOSpentVoiceCredits(
        uint8 _depth,
        uint256 _index,
        uint256 _leaf,
        uint256[][] memory _pathElements,
        uint256 _salt
    ) public view returns (bool) {
        uint256 computedRoot = computeMerkleRootFromPath(
            _depth,
            _index,
            _leaf,
            _pathElements
        );

        uint256 computedCommitment = hashLeftRight(computedRoot, _salt);
        return computedCommitment == currentPerVOSpentVoiceCreditsCommitment;
    }

    /*
     * Verify the total number of spent voice credits.
     * @param _spent The value to verify
     * @param _salt The salt which is hashed with the value to generate the
     *              commitment to the spent voice credits.
     */
    function verifySpentVoiceCredits(
        uint256 _spent,
        uint256 _salt
    ) public view returns (bool) {
        uint256 computedCommitment = hashLeftRight(_spent, _salt);
        return computedCommitment == currentSpentVoiceCreditsCommitment;
    }

    function calcEmptyVoteOptionTreeRoot(uint8 _levels) public pure returns (uint256) {
        return computeEmptyQuinRoot(_levels, 0);
    }

    function getMessageTreeRoot() public view returns (uint256) {
        return messageTree.root();
    }

    function getStateTreeRoot() public view returns (uint256) {
        return stateTree.root();
    }
}
