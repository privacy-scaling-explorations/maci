pragma circom 2.0.0;

// circomlib import
include "./mux1.circom";

// local imports
include "./utils/hashers.circom";
include "./utils/messageToCommand.circom";
include "./utils/privToPubKey.circom";
include "./utils/stateLeafAndBallotTransformer.circom";
include "./trees/incrementalQuinaryTree.circom";
// zk-kit imports
include "./safe-comparators.circom";

/**
 * Proves the correctness of processing a batch of MACI messages.
 * The msgBatchDepth parameter is known as msgSubtreeDepth and indicates the depth 
 * of the shortest tree that can fit all the messages in a batch.
 * This template supports the Quadratic Voting (QV).
 */
template ProcessMessages(
    stateTreeDepth,
    msgTreeDepth,
    msgBatchDepth,
    voteOptionTreeDepth
) {
    // Must ensure that the trees have a valid structure.
    assert(stateTreeDepth > 0);
    assert(msgBatchDepth > 0);
    assert(voteOptionTreeDepth > 0);
    assert(msgTreeDepth >= msgBatchDepth);

    // Default for IQT (quinary trees).
    var TREE_ARITY = 5;
    var batchSize = TREE_ARITY ** msgBatchDepth;
    var MSG_LENGTH = 11;
    var PACKED_CMD_LENGTH = 4;
    var STATE_LEAF_LENGTH = 4;
    var BALLOT_LENGTH = 2;
    var BALLOT_NONCE_IDX = 0;
    var BALLOT_VO_ROOT_IDX = 1;
    var STATE_LEAF_PUB_X_IDX = 0;
    var STATE_LEAF_PUB_Y_IDX = 1;
    var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;
    var STATE_LEAF_TIMESTAMP_IDX = 3;
    var msgTreeZeroValue = 8370432830353022751713833565135785980866757267633941821328460903436894336785;

    // nb. The usage of SHA-256 hash is necessary to save some gas costs at verification time
    // at the cost of more constraints for the prover.
    // Basically, some values from the contract are passed as private inputs and the hash as a public input.

    // The SHA-256 hash of values provided by the contract.
    signal input inputHash;
    signal input packedVals;
    // Number of users that have completed the sign up.
    signal numSignUps;
    // Number of options for this poll.
    signal maxVoteOptions;
    // Time when the poll ends.
    signal input pollEndTimestamp;
    // The existing message tree root.
    signal input msgRoot;
    // The messages.
    signal input msgs[batchSize][MSG_LENGTH];
    // Sibling messages.
    signal input msgSubrootPathElements[msgTreeDepth - msgBatchDepth][TREE_ARITY - 1];
    // The coordinator's private key.
    signal input coordPrivKey;
    // The cooordinator's public key (derived from the contract).
    signal input coordPubKey[2];
    // The ECDH public key per message.
    signal input encPubKeys[batchSize][2];
    // The current state root (before the processing).
    signal input currentStateRoot;

    // The state leaves upon which messages are applied.
    //    transform(currentStateLeaf[4], message5) => newStateLeaf4
    //    transform(currentStateLeaf[3], message4) => newStateLeaf3
    //    transform(currentStateLeaf[2], message3) => newStateLeaf2
    //    transform(currentStateLeaf[1], message1) => newStateLeaf1
    //    transform(currentStateLeaf[0], message0) => newStateLeaf0
    //    ...

    signal input currentStateLeaves[batchSize][STATE_LEAF_LENGTH];
    // The Merkle path to each incremental new state root.
    signal input currentStateLeavesPathElements[batchSize][stateTreeDepth][TREE_ARITY - 1];
    // The salted commitment to the state and ballot roots.
    signal input currentSbCommitment;
    signal input currentSbSalt;
    // The salted commitment to the new state and ballot roots.
    signal input newSbCommitment;
    signal input newSbSalt;
    // The ballots before message processing.
    signal input currentBallotRoot;
    // Intermediate ballots.
    signal input currentBallots[batchSize][BALLOT_LENGTH];
    signal input currentBallotsPathElements[batchSize][stateTreeDepth][TREE_ARITY - 1];
    // Intermediate vote weights.
    signal input currentVoteWeights[batchSize];
    signal input currentVoteWeightsPathElements[batchSize][voteOptionTreeDepth][TREE_ARITY - 1];

    // nb. The messages are processed in REVERSE order.
    // Therefore, the index of the first message to process does not match the index of the
    // first message (e.g., [msg1, msg2, msg3] => first message to process has index 3).

    // The index of the first message leaf in the batch, inclusive.
    signal batchStartIndex;
    
    // The index of the last message leaf in the batch to process, exclusive.
    // This value may be less than batchStartIndex + batchSize if this batch is
    // the last batch and the total number of mesages is not a multiple of the batch size.
    signal batchEndIndex;

    // The history of state and ballot roots and temporary intermediate
    // signals (for processing purposes).
    signal stateRoots[batchSize + 1];
    signal ballotRoots[batchSize + 1];
    signal tmpStateRoot1[batchSize];
    signal tmpStateRoot2[batchSize];
    signal tmpBallotRoot1[batchSize];
    signal tmpBallotRoot2[batchSize];

    // Must verify the current sb commitment.
    var currentSbCommitmentHash = PoseidonHasher(3)([currentStateRoot, currentBallotRoot, currentSbSalt]);
    currentSbCommitmentHash === currentSbCommitment;

    // Verify "public" inputs and assign unpacked values.
    var (ihMaxVoteOptions, ihNumSignUps, ihBatchStartIndex, ihBatchEndIndex, ihHash) = ProcessMessagesInputHasher()(
        packedVals,
        coordPubKey,
        msgRoot,
        currentSbCommitment,
        newSbCommitment,
        pollEndTimestamp
    );

    // The unpacked values from packedVals.
    ihMaxVoteOptions ==> maxVoteOptions;
    ihNumSignUps ==> numSignUps;
    ihBatchStartIndex ==> batchStartIndex;
    ihBatchEndIndex ==> batchEndIndex;
    // Matching constraints.
    ihHash === inputHash;

    // 0. Ensure that the maximum vote options signal is valid and if
    // the maximum users signal is valid.
    var maxVoValid = LessEqThan(32)([maxVoteOptions, TREE_ARITY ** voteOptionTreeDepth]);
    maxVoValid === 1;

    // Check numSignUps < the max number of users (i.e., number of state leaves
    // that can fit the state tree).
    var numSignUpsValid = LessEqThan(32)([numSignUps, TREE_ARITY ** stateTreeDepth]);
    numSignUpsValid === 1;

    // Hash each Message to check their existence in the Message tree.
    var messageHashers[batchSize];
    for (var i = 0; i < batchSize; i++) {
        messageHashers[i] = MessageHasher()(msgs[i], encPubKeys[i]);
    }

    // If batchEndIndex - batchStartIndex < batchSize, the remaining
    // message hashes should be the zero value.
    // e.g. [m, z, z, z, z] if there is only 1 real message in the batch
    // This makes possible to have a batch of messages which is only partially full.
    var leaves[batchSize];
    var pathElements[msgTreeDepth - msgBatchDepth][TREE_ARITY - 1];
    var pathIndex[msgTreeDepth - msgBatchDepth];

    for (var i = 0; i < batchSize; i++) {
        var lt = SafeLessThan(32)([batchStartIndex + i, batchEndIndex]);
        var mux = Mux1()([msgTreeZeroValue, messageHashers[i]], lt);

        leaves[i] = mux;
    }

    for (var i = 0; i < msgTreeDepth - msgBatchDepth; i++) {
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            pathElements[i][j] = msgSubrootPathElements[i][j];
        }
    }

    // Computing the path_index values. Since msgBatchLeavesExists tests
    // the existence of a subroot, the length of the proof correspond to the last 
    // n elements of a proof from the root to a leaf, where n = msgTreeDepth - msgBatchDepth.
    // e.g. if batchStartIndex = 25, msgTreeDepth = 4, msgBatchDepth = 2, then path_index = [1, 0].
    var msgBatchPathIndices[msgTreeDepth] = QuinGeneratePathIndices(msgTreeDepth)(batchStartIndex);

    for (var i = msgBatchDepth; i < msgTreeDepth; i++) {
        pathIndex[i - msgBatchDepth] = msgBatchPathIndices[i];
    }

    // Check whether each message exists in the Message tree.
    // Otherwise, throws (needs constraint to prevent such a proof).
    // To save constraints, compute the subroot of the messages and check
    // whether the subroot is a member of the message tree. This means that
    // batchSize must be the message tree arity raised to some power (e.g. 5 ^ n).
    QuinBatchLeavesExists(msgTreeDepth, msgBatchDepth)(
        msgRoot,
        leaves,
        pathIndex,
        pathElements   
    );

    // Decrypt each Message to a Command.
    // MessageToCommand derives the ECDH shared key from the coordinator's
    // private key and the message's ephemeral public key. Next, it uses this
    // shared key to decrypt a Message to a Command.

    // Ensure that the coordinator's public key from the contract is correct
    // based on the given private key - that is, the prover knows the
    // coordinator's private key.
    var derivedPubKey[2] = PrivToPubKey()(coordPrivKey);
    derivedPubKey === coordPubKey;

    // Decrypt each Message into a Command.
    // The command i-th is composed by the following fields.
    // e.g., command 0 is made of commandsStateIndex[0], 
    // commandsNewPubKey[0], ..., commandsPackedCommandOut[0]
    var commandsStateIndex[batchSize];
    var commandsNewPubKey[batchSize][2];
    var commandsVoteOptionIndex[batchSize];
    var commandsNewVoteWeight[batchSize];
    var commandsNonce[batchSize];
    var commandsPollId[batchSize];
    var commandsSalt[batchSize];
    var commandsSigR8[batchSize][2];
    var commandsSigS[batchSize];
    var commandsPackedCommandOut[batchSize][PACKED_CMD_LENGTH];

    for (var i = 0; i < batchSize; i++) {
        var message[MSG_LENGTH];
        for (var j = 0; j < MSG_LENGTH; j++) {
            message[j] = msgs[i][j];
        }

        (
            commandsStateIndex[i],
            commandsNewPubKey[i],
            commandsVoteOptionIndex[i],
            commandsNewVoteWeight[i],
            commandsNonce[i],
            commandsPollId[i],
            commandsSalt[i],
            commandsSigR8[i],
            commandsSigS[i],
            commandsPackedCommandOut[i]
        ) = MessageToCommand()(message, coordPrivKey, encPubKeys[i]);
    }

    // Process messages in reverse order.
    // Assign current state and ballot roots.
    stateRoots[batchSize] <== currentStateRoot;
    ballotRoots[batchSize] <== currentBallotRoot;

    // Define vote type message processors.
    var newVoteStateRoot[batchSize];
    var newVoteBallotRoot[batchSize];
    // Define topup type message processors.
    var newTopupStateRoot[batchSize];

    // Start from batchSize and decrement for process in reverse order.
    for (var i = batchSize - 1; i >= 0; i --) {
        // Process as vote type message.
        var currentStateLeavesPathElement[stateTreeDepth][TREE_ARITY - 1];
        var currentBallotPathElement[stateTreeDepth][TREE_ARITY - 1];
        var currentVoteWeightsPathElement[voteOptionTreeDepth][TREE_ARITY - 1];
        
        for (var j = 0; j < stateTreeDepth; j++) {
            for (var k = 0; k < TREE_ARITY - 1; k++) {
                currentStateLeavesPathElement[j][k] = currentStateLeavesPathElements[i][j][k];
                currentBallotPathElement[j][k] = currentBallotsPathElements[i][j][k];
            }
        }

        for (var j = 0; j < voteOptionTreeDepth; j++) {
            for (var k = 0; k < TREE_ARITY - 1; k++) {
                currentVoteWeightsPathElement[j][k] = currentVoteWeightsPathElements[i][j][k];
            }
        }
        
        (newVoteStateRoot[i], newVoteBallotRoot[i]) = ProcessOne(stateTreeDepth, voteOptionTreeDepth)(
            msgs[i][0],
            numSignUps,
            maxVoteOptions,
            pollEndTimestamp,
            stateRoots[i + 1],
            ballotRoots[i + 1],
            currentStateLeaves[i],
            currentStateLeavesPathElement,
            currentBallots[i],
            currentBallotPathElement,
            currentVoteWeights[i],
            currentVoteWeightsPathElement,
            commandsStateIndex[i],
            msgs[i][1],
            commandsNewPubKey[i],
            commandsVoteOptionIndex[i],
            commandsNewVoteWeight[i],
            commandsNonce[i],
            commandsPollId[i],
            commandsSalt[i],
            commandsSigR8[i],
            commandsSigS[i],
            commandsPackedCommandOut[i]
        );

        // Process as topup type message.
        newTopupStateRoot[i] = ProcessTopup(stateTreeDepth)(
            msgs[i][0],
            msgs[i][1],
            msgs[i][2],
            numSignUps,
            currentStateLeaves[i],
            currentStateLeavesPathElement
        );

        // Pick the correct result by Message type.
        tmpStateRoot1[i] <== newVoteStateRoot[i] * (2 - msgs[i][0]); 
        tmpStateRoot2[i] <== newTopupStateRoot[i] * (msgs[i][0] - 1);

        tmpBallotRoot1[i] <== newVoteBallotRoot[i] * (2 - msgs[i][0]); 
        tmpBallotRoot2[i] <== ballotRoots[i + 1] * (msgs[i][0] - 1);

        stateRoots[i] <== tmpStateRoot1[i] + tmpStateRoot2[i];

        ballotRoots[i] <== tmpBallotRoot1[i] + tmpBallotRoot2[i];
    }

    var sbCommitmentHash = PoseidonHasher(3)([stateRoots[0], ballotRoots[0], newSbSalt]);
    sbCommitmentHash === newSbCommitment;
}

/**
 * Proves the correctness of processing a batch of MACI messages.
 * The msgBatchDepth parameter is known as msgSubtreeDepth and indicates the depth 
 * of the shortest tree that can fit all the messages in a batch.
 * This template does not support the Quadratic Voting (QV).
 */
 template ProcessMessagesNonQv(
    stateTreeDepth,
    msgTreeDepth,
    msgBatchDepth,
    voteOptionTreeDepth
) {
    // Must ensure that the trees have a valid structure.
    assert(stateTreeDepth > 0);
    assert(msgBatchDepth > 0);
    assert(voteOptionTreeDepth > 0);
    assert(msgTreeDepth >= msgBatchDepth);

    // Default for IQT (quinary trees).
    var TREE_ARITY = 5;
    var batchSize = TREE_ARITY ** msgBatchDepth;
    var MSG_LENGTH = 11;
    var PACKED_CMD_LENGTH = 4;
    var STATE_LEAF_LENGTH = 4;
    var BALLOT_LENGTH = 2;
    var BALLOT_NONCE_IDX = 0;
    var BALLOT_VO_ROOT_IDX = 1;
    var STATE_LEAF_PUB_X_IDX = 0;
    var STATE_LEAF_PUB_Y_IDX = 1;
    var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;
    var STATE_LEAF_TIMESTAMP_IDX = 3;
    var msgTreeZeroValue = 8370432830353022751713833565135785980866757267633941821328460903436894336785;

    // nb. The usage of SHA-256 hash is necessary to save some gas costs at verification time
    // at the cost of more constraints for the prover.
    // Basically, some values from the contract are passed as private inputs and the hash as a public input.

    // The SHA-256 hash of values provided by the contract.
    signal input inputHash;
    signal input packedVals;
    // Number of users that have completed the sign up.
    signal numSignUps;
    // Number of options for this poll.
    signal maxVoteOptions;
    // Time when the poll ends.
    signal input pollEndTimestamp;
    // The existing message tree root.
    signal input msgRoot;
    // The messages.
    signal input msgs[batchSize][MSG_LENGTH];
    // Sibling messages.
    signal input msgSubrootPathElements[msgTreeDepth - msgBatchDepth][TREE_ARITY - 1];
    // The coordinator's private key.
    signal input coordPrivKey;
    // The cooordinator's public key (derived from the contract).
    signal input coordPubKey[2];
    // The ECDH public key per message.
    signal input encPubKeys[batchSize][2];
    // The current state root (before the processing).
    signal input currentStateRoot;

    // The state leaves upon which messages are applied.
    //    transform(currentStateLeaf[4], message5) => newStateLeaf4
    //    transform(currentStateLeaf[3], message4) => newStateLeaf3
    //    transform(currentStateLeaf[2], message3) => newStateLeaf2
    //    transform(currentStateLeaf[1], message1) => newStateLeaf1
    //    transform(currentStateLeaf[0], message0) => newStateLeaf0
    //    ...

    signal input currentStateLeaves[batchSize][STATE_LEAF_LENGTH];
    // The Merkle path to each incremental new state root.
    signal input currentStateLeavesPathElements[batchSize][stateTreeDepth][TREE_ARITY - 1];
    // The salted commitment to the state and ballot roots.
    signal input currentSbCommitment;
    signal input currentSbSalt;
    // The salted commitment to the new state and ballot roots.
    signal input newSbCommitment;
    signal input newSbSalt;
    // The ballots before message processing.
    signal input currentBallotRoot;
    // Intermediate ballots.
    signal input currentBallots[batchSize][BALLOT_LENGTH];
    signal input currentBallotsPathElements[batchSize][stateTreeDepth][TREE_ARITY - 1];
    // Intermediate vote weights.
    signal input currentVoteWeights[batchSize];
    signal input currentVoteWeightsPathElements[batchSize][voteOptionTreeDepth][TREE_ARITY - 1];

    // nb. The messages are processed in REVERSE order.
    // Therefore, the index of the first message to process does not match the index of the
    // first message (e.g., [msg1, msg2, msg3] => first message to process has index 3).

    // The index of the first message leaf in the batch, inclusive.
    signal batchStartIndex;
    
    // The index of the last message leaf in the batch to process, exclusive.
    // This value may be less than batchStartIndex + batchSize if this batch is
    // the last batch and the total number of mesages is not a multiple of the batch size.
    signal batchEndIndex;

    // The history of state and ballot roots and temporary intermediate
    // signals (for processing purposes).
    signal stateRoots[batchSize + 1];
    signal ballotRoots[batchSize + 1];
    signal tmpStateRoot1[batchSize];
    signal tmpStateRoot2[batchSize];
    signal tmpBallotRoot1[batchSize];
    signal tmpBallotRoot2[batchSize];

    // Must verify the current sb commitment.
    var currentSbCommitmentHash = PoseidonHasher(3)([currentStateRoot, currentBallotRoot, currentSbSalt]);
    currentSbCommitmentHash === currentSbCommitment;

    // Verify "public" inputs and assign unpacked values.
    var (ihMaxVoteOptions, ihNumSignUps, ihBatchStartIndex, ihBatchEndIndex, ihHash) = ProcessMessagesInputHasher()(
        packedVals,
        coordPubKey,
        msgRoot,
        currentSbCommitment,
        newSbCommitment,
        pollEndTimestamp
    );

    // The unpacked values from packedVals.
    ihMaxVoteOptions ==> maxVoteOptions;
    ihNumSignUps ==> numSignUps;
    ihBatchStartIndex ==> batchStartIndex;
    ihBatchEndIndex ==> batchEndIndex;
    // Matching constraints.
    ihHash === inputHash;

    //  ----------------------------------------------------------------------- 
    // 0. Ensure that the maximum vote options signal is valid and if
    // the maximum users signal is valid.
    var maxVoValid = LessEqThan(32)([maxVoteOptions, TREE_ARITY ** voteOptionTreeDepth]);
    maxVoValid === 1;

    // Check numSignUps < the max number of users (i.e., number of state leaves
    // that can fit the state tree).
    var numSignUpsValid = LessEqThan(32)([numSignUps, TREE_ARITY ** stateTreeDepth]);
    numSignUpsValid === 1;

    // Hash each Message to check their existence in the Message tree.
    var messageHashers[batchSize];
    for (var i = 0; i < batchSize; i++) {
        messageHashers[i] = MessageHasher()(msgs[i], encPubKeys[i]);
    }

    // If batchEndIndex - batchStartIndex < batchSize, the remaining
    // message hashes should be the zero value.
    // e.g. [m, z, z, z, z] if there is only 1 real message in the batch
    // This makes possible to have a batch of messages which is only partially full.
    var leaves[batchSize];
    var pathElements[msgTreeDepth - msgBatchDepth][TREE_ARITY - 1];
    var pathIndex[msgTreeDepth - msgBatchDepth];

    for (var i = 0; i < batchSize; i++) {
        var lt = SafeLessThan(32)([batchStartIndex + i, batchEndIndex]);
        var mux = Mux1()([msgTreeZeroValue, messageHashers[i]], lt);

        leaves[i] = mux;
    }

    for (var i = 0; i < msgTreeDepth - msgBatchDepth; i++) {
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            pathElements[i][j] = msgSubrootPathElements[i][j];
        }
    }

    // Computing the path_index values. Since msgBatchLeavesExists tests
    // the existence of a subroot, the length of the proof correspond to the last 
    // n elements of a proof from the root to a leaf, where n = msgTreeDepth - msgBatchDepth.
    // e.g. if batchStartIndex = 25, msgTreeDepth = 4, msgBatchDepth = 2, then path_index = [1, 0].
    var msgBatchPathIndices[msgTreeDepth] = QuinGeneratePathIndices(msgTreeDepth)(batchStartIndex);

    for (var i = msgBatchDepth; i < msgTreeDepth; i++) {
        pathIndex[i - msgBatchDepth] = msgBatchPathIndices[i];
    }

    // Check whether each message exists in the Message tree.
    // Otherwise, throws (needs constraint to prevent such a proof).
    // To save constraints, compute the subroot of the messages and check
    // whether the subroot is a member of the message tree. This means that
    // batchSize must be the message tree arity raised to some power (e.g. 5 ^ n).
    QuinBatchLeavesExists(msgTreeDepth, msgBatchDepth)(
        msgRoot,
        leaves,
        pathIndex,
        pathElements   
    );

    // Decrypt each Message to a Command.
    // MessageToCommand derives the ECDH shared key from the coordinator's
    // private key and the message's ephemeral public key. Next, it uses this
    // shared key to decrypt a Message to a Command.

    // Ensure that the coordinator's public key from the contract is correct
    // based on the given private key - that is, the prover knows the
    // coordinator's private key.
    var derivedPubKey[2] = PrivToPubKey()(coordPrivKey);
    derivedPubKey === coordPubKey;

    // Decrypt each Message into a Command.
    // The command i-th is composed by the following fields.
    // e.g., command 0 is made of commandsStateIndex[0], 
    // commandsNewPubKey[0], ..., commandsPackedCommandOut[0]
    var commandsStateIndex[batchSize];
    var commandsNewPubKey[batchSize][2];
    var commandsVoteOptionIndex[batchSize];
    var commandsNewVoteWeight[batchSize];
    var commandsNonce[batchSize];
    var commandsPollId[batchSize];
    var commandsSalt[batchSize];
    var commandsSigR8[batchSize][2];
    var commandsSigS[batchSize];
    var commandsPackedCommandOut[batchSize][PACKED_CMD_LENGTH];

    for (var i = 0; i < batchSize; i++) {
        var message[MSG_LENGTH];
        for (var j = 0; j < MSG_LENGTH; j++) {
            message[j] = msgs[i][j];
        }

        (
            commandsStateIndex[i],
            commandsNewPubKey[i],
            commandsVoteOptionIndex[i],
            commandsNewVoteWeight[i],
            commandsNonce[i],
            commandsPollId[i],
            commandsSalt[i],
            commandsSigR8[i],
            commandsSigS[i],
            commandsPackedCommandOut[i]
        ) = MessageToCommand()(message, coordPrivKey, encPubKeys[i]);
    }

    // Process messages in reverse order.
    // Assign current state and ballot roots.
    stateRoots[batchSize] <== currentStateRoot;
    ballotRoots[batchSize] <== currentBallotRoot;

    // Define vote type message processors.
    var newVoteStateRoot[batchSize];
    var newVoteBallotRoot[batchSize];
    // Define topup type message processors.
    var newTopupStateRoot[batchSize];

    // Start from batchSize and decrement for process in reverse order.
    for (var i = batchSize - 1; i >= 0; i --) {
        // Process as vote type message.
        var currentStateLeavesPathElement[stateTreeDepth][TREE_ARITY - 1];
        var currentBallotPathElement[stateTreeDepth][TREE_ARITY - 1];
        var currentVoteWeightsPathElement[voteOptionTreeDepth][TREE_ARITY - 1];
        
        for (var j = 0; j < stateTreeDepth; j++) {
            for (var k = 0; k < TREE_ARITY - 1; k++) {
                currentStateLeavesPathElement[j][k] = currentStateLeavesPathElements[i][j][k];
                currentBallotPathElement[j][k] = currentBallotsPathElements[i][j][k];
            }
        }

        for (var j = 0; j < voteOptionTreeDepth; j++) {
            for (var k = 0; k < TREE_ARITY - 1; k++) {
                currentVoteWeightsPathElement[j][k] = currentVoteWeightsPathElements[i][j][k];
            }
        }
        (newVoteStateRoot[i], newVoteBallotRoot[i]) = ProcessOneNonQv(stateTreeDepth, voteOptionTreeDepth)(
            msgs[i][0],
            numSignUps,
            maxVoteOptions,
            pollEndTimestamp,
            stateRoots[i + 1],
            ballotRoots[i + 1],
            currentStateLeaves[i],
            currentStateLeavesPathElement,
            currentBallots[i],
            currentBallotPathElement,
            currentVoteWeights[i],
            currentVoteWeightsPathElement,
            commandsStateIndex[i],
            msgs[i][1],
            commandsNewPubKey[i],
            commandsVoteOptionIndex[i],
            commandsNewVoteWeight[i],
            commandsNonce[i],
            commandsPollId[i],
            commandsSalt[i],
            commandsSigR8[i],
            commandsSigS[i],
            commandsPackedCommandOut[i]
        );

        // Process as topup type message.
        newTopupStateRoot[i] = ProcessTopup(stateTreeDepth)(
            msgs[i][0],
            msgs[i][1],
            msgs[i][2],
            numSignUps,
            currentStateLeaves[i],
            currentStateLeavesPathElement
        );

        // Pick the correct result by Message type.
        tmpStateRoot1[i] <== newVoteStateRoot[i] * (2 - msgs[i][0]); 
        tmpStateRoot2[i] <== newTopupStateRoot[i] * (msgs[i][0] - 1);

        tmpBallotRoot1[i] <== newVoteBallotRoot[i] * (2 - msgs[i][0]); 
        tmpBallotRoot2[i] <== ballotRoots[i + 1] * (msgs[i][0] - 1);

        stateRoots[i] <== tmpStateRoot1[i] + tmpStateRoot2[i];

        ballotRoots[i] <== tmpBallotRoot1[i] + tmpBallotRoot2[i];
    }

    var sbCommitmentHash = PoseidonHasher(3)([stateRoots[0], ballotRoots[0], newSbSalt]);
    sbCommitmentHash === newSbCommitment;
}

/**
 * Processes top-ups for a state tree, managing updates based on the transaction's message type and amount. 
 * Through conditional logic ensures messages are valid within the specified state tree depth and user sign-up count. 
 * Through mux components and balance checks, it updates the state leaf's voice credit balance, while verifying 
 * the message fields against the current state tree structure.
 * 
 * nb. the message type of top-up command is always equal to two.
 */
template ProcessTopup(stateTreeDepth) {
    // Constants defining the structure and size of state and ballots.
    var STATE_LEAF_LENGTH = 4;
    var MSG_LENGTH = 11;
    var TREE_ARITY = 5;

    // Indices for elements within a state leaf.
    // Public key.
    var STATE_LEAF_PUB_X_IDX = 0;
    var STATE_LEAF_PUB_Y_IDX = 1;
    // Voice Credit balance.
    var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;
    // Timestamp.
    var STATE_LEAF_TIMESTAMP_IDX = 3;
    var N_BITS = 252;

    // Inputs for the template.
    signal input msgType;
    signal input stateTreeIndex;
    signal input amount;
    signal input numSignUps;

    // The state leaf and related path elements.
    signal input stateLeaf[STATE_LEAF_LENGTH];
    // Sibling nodes at each level of the state tree to verify the specific state leaf.
    signal input stateLeafPathElements[stateTreeDepth][TREE_ARITY - 1];

    signal output newStateRoot;

    // skipping state leaf verify (checked in ProcessOne template).     
    
    // Amount to be processed, adjusted based on msgType.
    signal amt;
    // State tree index, adjusted based on msgType.
    signal index;
    // New credit balance after processing the message.
    signal newCreditBalance;

    // nb. msgType of top-up command is 2.
    amt <== amount * (msgType - 1); 
    index <== stateTreeIndex * (msgType - 1);
    
    // check the state index and, if invalid, set index and amount to zero.
    var validStateLeafIndex = LessEqThan(N_BITS)([index, numSignUps]);
    var indexMux = Mux1()([0, index], validStateLeafIndex);
    var amtMux =  Mux1()([0, amt], validStateLeafIndex);
    
    // check less than field size.
    newCreditBalance <== stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX] + amtMux;

    var validCreditBalance = LessEqThan(N_BITS)([
        stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX],
        newCreditBalance
    ]);

    // If the new one is <= the old one, then we have a valid topup.
    var creditBalanceMux = Mux1()([stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX], newCreditBalance], validCreditBalance);

    // update the voice balance balance.
    var newStateLeafHash = PoseidonHasher(4)([
        stateLeaf[STATE_LEAF_PUB_X_IDX],
        stateLeaf[STATE_LEAF_PUB_Y_IDX],
        creditBalanceMux,
        stateLeaf[STATE_LEAF_TIMESTAMP_IDX]
    ]);

    var stateLeafPathIndices[stateTreeDepth] = QuinGeneratePathIndices(stateTreeDepth)(indexMux);
    newStateRoot <== QuinTreeInclusionProof(stateTreeDepth)(
        newStateLeafHash,
        stateLeafPathIndices,
        stateLeafPathElements
    );
}

/**
 * Processes one message and updates the state accordingly. 
 * This template involves complex interactions, including transformations based on message type, 
 * validations against current states like voice credit balances or vote weights, 
 * and updates to Merkle trees representing state and ballot information. 
 * This is a critical building block for ensuring the integrity and correctness of MACI state.
 * This template supports the Quadratic Voting (QV).
 */
template ProcessOne(stateTreeDepth, voteOptionTreeDepth) {
    // Constants defining the structure and size of state and ballots.
    var STATE_LEAF_LENGTH = 4;
    var BALLOT_LENGTH = 2;
    var MSG_LENGTH = 11;
    var PACKED_CMD_LENGTH = 4;
    var TREE_ARITY = 5;
    var BALLOT_NONCE_IDX = 0;
    // Ballot vote option (VO) root index.
    var BALLOT_VO_ROOT_IDX = 1;

    // Indices for elements within a state leaf.
    // Public key.
    var STATE_LEAF_PUB_X_IDX = 0;
    var STATE_LEAF_PUB_Y_IDX = 1;
    // Voice Credit balance.
    var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;
    // Timestamp.
    var STATE_LEAF_TIMESTAMP_IDX = 3;
    var N_BITS = 252;

    // Inputs representing the message and the current state.
    signal input msgType;
    signal input numSignUps;
    signal input maxVoteOptions;
    signal input pollEndTimestamp;

    // The current value of the state tree root.
    signal input currentStateRoot;
    // The current value of the ballot tree root.
    signal input currentBallotRoot;

    // The state leaf and related path elements.
    signal input stateLeaf[STATE_LEAF_LENGTH];
    // Sibling nodes at each level of the state tree to verify the specific state leaf.
    signal input stateLeafPathElements[stateTreeDepth][TREE_ARITY - 1];

    // The ballot and related path elements.
    signal input ballot[BALLOT_LENGTH];
    signal input ballotPathElements[stateTreeDepth][TREE_ARITY - 1];

    // The current vote weight and related path elements.
    signal input currentVoteWeight;
    signal input currentVoteWeightsPathElements[voteOptionTreeDepth][TREE_ARITY - 1];

    // Inputs related to the command being processed.
    signal input cmdStateIndex;
    signal input topupStateIndex;
    signal input cmdNewPubKey[2];
    signal input cmdVoteOptionIndex;
    signal input cmdNewVoteWeight;
    signal input cmdNonce;
    signal input cmdPollId;
    signal input cmdSalt;
    signal input cmdSigR8[2];
    signal input cmdSigS;
    signal input packedCmd[PACKED_CMD_LENGTH];

    signal output newStateRoot;
    signal output newBallotRoot;

    // Intermediate signals.
    // cmdStateIndex * (2 - msgType).
    signal tmpIndex1;
    // topupStateIndex * (msgType - 1).
    signal tmpIndex2;
    // sum of tmpIndex1 + tmpIndex2.
    signal indexByType;
    // currentVoteWeight * currentVoteWeight.
    signal b;
    // cmdNewVoteWeight * cmdNewVoteWeight.
    signal c;
    // equal to newBallotVoRootMux (Mux1).
    signal newBallotVoRoot;

    // 1. Transform a state leaf and a ballot with a command.
    // The result is a new state leaf, a new ballot, and an isValid signal (0 or 1).
    var newSlPubKey[2], newBallotNonce, isValid;
    (newSlPubKey, newBallotNonce, isValid) = StateLeafAndBallotTransformer()(
        numSignUps,
        maxVoteOptions,
        [stateLeaf[STATE_LEAF_PUB_X_IDX], stateLeaf[STATE_LEAF_PUB_Y_IDX]],
        stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX],
        stateLeaf[STATE_LEAF_TIMESTAMP_IDX],
        pollEndTimestamp,
        ballot[BALLOT_NONCE_IDX],
        currentVoteWeight,
        cmdStateIndex,
        cmdNewPubKey,
        cmdVoteOptionIndex,
        cmdNewVoteWeight,
        cmdNonce,
        cmdPollId,
        cmdSalt,
        cmdSigR8,
        cmdSigS,
        packedCmd
    );

    // 2. If msgType and isValid are equal to zero, generate indices for leaf zero.
    // Otherwise, generate indices for commmand.stateIndex or topupStateIndex depending on msgType.
    tmpIndex1 <== cmdStateIndex * (2 - msgType);
    tmpIndex2 <== topupStateIndex * (msgType - 1);
    indexByType <== tmpIndex1 + tmpIndex2;

    var validStateLeafIndex = SafeLessThan(N_BITS)([indexByType, numSignUps]);

    var stateIndexMux = Mux1()([0, indexByType], validStateLeafIndex);
    var stateLeafPathIndices[stateTreeDepth] = QuinGeneratePathIndices(stateTreeDepth)(stateIndexMux);

    // 3. Verify that the original state leaf exists in the given state root.
    var stateLeafHash = PoseidonHasher(4)(stateLeaf);
    var stateLeafQip = QuinTreeInclusionProof(stateTreeDepth)(
        stateLeafHash,
        stateLeafPathIndices,
        stateLeafPathElements
    );

    stateLeafQip === currentStateRoot;

    // 4. Verify that the original ballot exists in the given ballot root.
    var ballotHash = PoseidonHasher(2)([
        ballot[BALLOT_NONCE_IDX], 
        ballot[BALLOT_VO_ROOT_IDX]
    ]);

    var ballotQip = QuinTreeInclusionProof(stateTreeDepth)(
        ballotHash,
        stateLeafPathIndices,
        ballotPathElements
    );

    ballotQip === currentBallotRoot;

    // 5. Verify that currentVoteWeight exists in the ballot's vote option root
    // at cmdVoteOptionIndex.
    b <== currentVoteWeight * currentVoteWeight;
    c <== cmdNewVoteWeight * cmdNewVoteWeight;

    var enoughVoiceCredits = SafeGreaterEqThan(252)([
        stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX] + b,
        c
    ]);

    var isMessageValid = IsEqual()([2, isValid + enoughVoiceCredits]);
    var validVoteOptionIndex = SafeLessThan(N_BITS)([cmdVoteOptionIndex, maxVoteOptions]);
    var cmdVoteOptionIndexMux = Mux1()([0, cmdVoteOptionIndex], validVoteOptionIndex);
    var currentVoteWeightPathIndices[voteOptionTreeDepth] = QuinGeneratePathIndices(voteOptionTreeDepth)(cmdVoteOptionIndexMux);

    var currentVoteWeightQip = QuinTreeInclusionProof(voteOptionTreeDepth)(
        currentVoteWeight,
        currentVoteWeightPathIndices,
        currentVoteWeightsPathElements
    );

    currentVoteWeightQip === ballot[BALLOT_VO_ROOT_IDX];

    var voteWeightMux = Mux1()([currentVoteWeight, cmdNewVoteWeight], isMessageValid);

    var newSlVoiceCreditBalance = Mux1()(
        [
            stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX],
            stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX] + b - c
        ],
        enoughVoiceCredits
    );

    var voiceCreditBalanceMux = Mux1()(
        [
            stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX],
            newSlVoiceCreditBalance
        ],
        isMessageValid
    );

    // 5.1. Update the ballot's vote option root with the new vote weight.
    var newVoteOptionTreeQip = QuinTreeInclusionProof(voteOptionTreeDepth)(
        voteWeightMux,
        currentVoteWeightPathIndices,
        currentVoteWeightsPathElements
    );

    // The new vote option root in the ballot
    var newBallotVoRootMux = Mux1()(
        [ballot[BALLOT_VO_ROOT_IDX], newVoteOptionTreeQip],
        isMessageValid
    );

    newBallotVoRoot <== newBallotVoRootMux;

    // 6. Generate a new state root.
    var newStateLeafhash = PoseidonHasher(4)([
        newSlPubKey[STATE_LEAF_PUB_X_IDX],
        newSlPubKey[STATE_LEAF_PUB_Y_IDX],
        voiceCreditBalanceMux,
        stateLeaf[STATE_LEAF_TIMESTAMP_IDX]
    ]);

    var newStateLeafQip = QuinTreeInclusionProof(stateTreeDepth)(
        newStateLeafhash,
        stateLeafPathIndices,
        stateLeafPathElements
    );

    newStateRoot <== newStateLeafQip;
 
    // 7. Generate a new ballot root.    
    var newBallotNonceMux = Mux1()([ballot[BALLOT_NONCE_IDX], newBallotNonce], isMessageValid);

    var newBallotHash = PoseidonHasher(2)([newBallotNonceMux, newBallotVoRoot]);

    var newBallotQip = QuinTreeInclusionProof(stateTreeDepth)(
        newBallotHash,
        stateLeafPathIndices,
        ballotPathElements
    );

    newBallotRoot <== newBallotQip;
}

/**
 * Processes one message and updates the state accordingly. 
 * This template involves complex interactions, including transformations based on message type, 
 * validations against current states like voice credit balances or vote weights, 
 * and updates to Merkle trees representing state and ballot information. 
 * This is a critical building block for ensuring the integrity and correctness of MACI state.
 * This template does not support the Quadratic Voting (QV).
 */
template ProcessOneNonQv(stateTreeDepth, voteOptionTreeDepth) {
    // Constants defining the structure and size of state and ballots.
    var STATE_LEAF_LENGTH = 4;
    var BALLOT_LENGTH = 2;
    var MSG_LENGTH = 11;
    var PACKED_CMD_LENGTH = 4;
    var TREE_ARITY = 5;
    var BALLOT_NONCE_IDX = 0;
    // Ballot vote option (VO) root index.
    var BALLOT_VO_ROOT_IDX = 1;

    // Indices for elements within a state leaf.
    // Public key.
    var STATE_LEAF_PUB_X_IDX = 0;
    var STATE_LEAF_PUB_Y_IDX = 1;
    // Voice Credit balance.
    var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;
    // Timestamp.
    var STATE_LEAF_TIMESTAMP_IDX = 3;
    var N_BITS = 252;

    // Inputs representing the message and the current state.
    signal input msgType;
    signal input numSignUps;
    signal input maxVoteOptions;
    signal input pollEndTimestamp;

    // The current value of the state tree root.
    signal input currentStateRoot;
    // The current value of the ballot tree root.
    signal input currentBallotRoot;

    // The state leaf and related path elements.
    signal input stateLeaf[STATE_LEAF_LENGTH];
    // Sibling nodes at each level of the state tree to verify the specific state leaf.
    signal input stateLeafPathElements[stateTreeDepth][TREE_ARITY - 1];

    // The ballot and related path elements.
    signal input ballot[BALLOT_LENGTH];
    signal input ballotPathElements[stateTreeDepth][TREE_ARITY - 1];

    // The current vote weight and related path elements.
    signal input currentVoteWeight;
    signal input currentVoteWeightsPathElements[voteOptionTreeDepth][TREE_ARITY - 1];

    // Inputs related to the command being processed.
    signal input cmdStateIndex;
    signal input topupStateIndex;
    signal input cmdNewPubKey[2];
    signal input cmdVoteOptionIndex;
    signal input cmdNewVoteWeight;
    signal input cmdNonce;
    signal input cmdPollId;
    signal input cmdSalt;
    signal input cmdSigR8[2];
    signal input cmdSigS;
    signal input packedCmd[PACKED_CMD_LENGTH];

    signal output newStateRoot;
    signal output newBallotRoot;

    // Intermediate signals.
    // cmdStateIndex * (2 - msgType).
    signal tmpIndex1;
    // topupStateIndex * (msgType - 1).
    signal tmpIndex2;
    // sum of tmpIndex1 + tmpIndex2.
    signal indexByType;
    // currentVoteWeight * currentVoteWeight.
    signal b;
    // cmdNewVoteWeight * cmdNewVoteWeight.
    signal c;
    // equal to newBallotVoRootMux (Mux1).
    signal newBallotVoRoot;

    // 1. Transform a state leaf and a ballot with a command.
    // The result is a new state leaf, a new ballot, and an isValid signal (0 or 1).
    var newSlPubKey[2], newBallotNonce, isValid;
    (newSlPubKey, newBallotNonce, isValid) = StateLeafAndBallotTransformerNonQv()(
        numSignUps,
        maxVoteOptions,
        [stateLeaf[STATE_LEAF_PUB_X_IDX], stateLeaf[STATE_LEAF_PUB_Y_IDX]],
        stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX],
        stateLeaf[STATE_LEAF_TIMESTAMP_IDX],
        pollEndTimestamp,
        ballot[BALLOT_NONCE_IDX],
        currentVoteWeight,
        cmdStateIndex,
        cmdNewPubKey,
        cmdVoteOptionIndex,
        cmdNewVoteWeight,
        cmdNonce,
        cmdPollId,
        cmdSalt,
        cmdSigR8,
        cmdSigS,
        packedCmd
    );

    // 2. If msgType and isValid are equal to zero, generate indices for leaf zero.
    // Otherwise, generate indices for commmand.stateIndex or topupStateIndex depending on msgType.
    tmpIndex1 <== cmdStateIndex * (2 - msgType);
    tmpIndex2 <== topupStateIndex * (msgType - 1);
    indexByType <== tmpIndex1 + tmpIndex2;

    var validStateLeafIndex = SafeLessThan(N_BITS)([indexByType, numSignUps]);
    var stateIndexMux = Mux1()([0, indexByType], validStateLeafIndex);
    var stateLeafPathIndices[stateTreeDepth] = QuinGeneratePathIndices(stateTreeDepth)(stateIndexMux);

    // 3. Verify that the original state leaf exists in the given state root.
    var stateLeafHash = PoseidonHasher(4)(stateLeaf);
    var stateLeafQip = QuinTreeInclusionProof(stateTreeDepth)(
        stateLeafHash,
        stateLeafPathIndices,
        stateLeafPathElements
    );

    stateLeafQip === currentStateRoot;

    // 4. Verify that the original ballot exists in the given ballot root.
    var ballotHash = PoseidonHasher(2)([
        ballot[BALLOT_NONCE_IDX], 
        ballot[BALLOT_VO_ROOT_IDX]
    ]);

    var ballotQip = QuinTreeInclusionProof(stateTreeDepth)(
        ballotHash,
        stateLeafPathIndices,
        ballotPathElements
    );

    ballotQip === currentBallotRoot;

    // 5. Verify that currentVoteWeight exists in the ballot's vote option root
    // at cmdVoteOptionIndex.
    b <== currentVoteWeight;
    c <== cmdNewVoteWeight;

    var enoughVoiceCredits = SafeGreaterEqThan(252)([
        stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX] + b,
        c
    ]);

    var isMessageValid = IsEqual()([2, isValid + enoughVoiceCredits]);

    var validVoteOptionIndex = SafeLessThan(N_BITS)([cmdVoteOptionIndex, maxVoteOptions]);

    var cmdVoteOptionIndexMux = Mux1()([0, cmdVoteOptionIndex], validVoteOptionIndex);

    var currentVoteWeightPathIndices[voteOptionTreeDepth] = QuinGeneratePathIndices(voteOptionTreeDepth)(cmdVoteOptionIndexMux);

    var currentVoteWeightQip = QuinTreeInclusionProof(voteOptionTreeDepth)(
        currentVoteWeight,
        currentVoteWeightPathIndices,
        currentVoteWeightsPathElements
    );

    currentVoteWeightQip === ballot[BALLOT_VO_ROOT_IDX];

    var voteWeightMux = Mux1()([currentVoteWeight, cmdNewVoteWeight], isMessageValid);

    var newSlVoiceCreditBalance = Mux1()(
        [
            stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX],
            stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX] + b - c
        ],
        enoughVoiceCredits
    );

    var voiceCreditBalanceMux = Mux1()(
        [
            stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX],
            newSlVoiceCreditBalance
        ],
        isMessageValid
    );

    // 5.1. Update the ballot's vote option root with the new vote weight.
    var newVoteOptionTreeQip = QuinTreeInclusionProof(voteOptionTreeDepth)(
        voteWeightMux,
        currentVoteWeightPathIndices,
        currentVoteWeightsPathElements
    );

    // The new vote option root in the ballot
    var newBallotVoRootMux = Mux1()(
        [ballot[BALLOT_VO_ROOT_IDX], newVoteOptionTreeQip],
        isMessageValid
    );

    newBallotVoRoot <== newBallotVoRootMux;

    // 6. Generate a new state root.
    var newStateLeafhash = PoseidonHasher(4)([
        newSlPubKey[STATE_LEAF_PUB_X_IDX],
        newSlPubKey[STATE_LEAF_PUB_Y_IDX],
        voiceCreditBalanceMux,
        stateLeaf[STATE_LEAF_TIMESTAMP_IDX]
    ]);

    var newStateLeafQip = QuinTreeInclusionProof(stateTreeDepth)(
        newStateLeafhash,
        stateLeafPathIndices,
        stateLeafPathElements
    );

    newStateRoot <== newStateLeafQip;
 
    // 7. Generate a new ballot root.    
    var newBallotNonceMux = Mux1()([ballot[BALLOT_NONCE_IDX], newBallotNonce], isMessageValid);

    var newBallotHash = PoseidonHasher(2)([newBallotNonceMux, newBallotVoRoot]);

    var newBallotQip = QuinTreeInclusionProof(stateTreeDepth)(
        newBallotHash,
        stateLeafPathIndices,
        ballotPathElements
    );

    newBallotRoot <== newBallotQip;
}

/**
 * Processes various inputs, including packed values and public keys, to produce a SHA256 hash. 
 * It unpacks consolidated inputs like vote options and sign-up counts, validates them, 
 * hashes the coordinator's public key, and finally hashes all inputs together.
 */
template ProcessMessagesInputHasher() {
    // Combine the following into 1 input element:
    // - maxVoteOptions (50 bits)
    // - numSignUps (50 bits)
    // - batchStartIndex (50 bits)
    // - batchEndIndex (50 bits)
    // Hash coordPubKey:
    // - coordPubKeyHash 
    // Other inputs that can't be compressed or packed:
    // - msgRoot, currentSbCommitment, newSbCommitment
    var UNPACK_ELEM_LENGTH = 4;

    signal input packedVals;
    signal input coordPubKey[2];
    signal input msgRoot;
    // The current state and ballot root commitment (hash(stateRoot, ballotRoot, salt).
    signal input currentSbCommitment;
    signal input newSbCommitment;
    signal input pollEndTimestamp;

    signal output maxVoteOptions;
    signal output numSignUps;
    signal output batchStartIndex;
    signal output batchEndIndex;
    signal output hash;
    
    // 1. Unpack packedVals and ensure that it is valid.
    var unpack[UNPACK_ELEM_LENGTH] = UnpackElement(UNPACK_ELEM_LENGTH)(packedVals);

    maxVoteOptions <== unpack[3];
    numSignUps <== unpack[2];
    batchStartIndex <== unpack[1];
    batchEndIndex <== unpack[0];

    // 2. Hash coordPubKey.
    var pubKeyHash = PoseidonHasher(2)(coordPubKey);

    // 3. Hash the 6 inputs with SHA256.
    hash <== Sha256Hasher(6)([
        packedVals,
        pubKeyHash,
        msgRoot,
        currentSbCommitment,
        newSbCommitment,
        pollEndTimestamp
    ]);
}