include "./messageHasher.circom";
include "./messageToCommand.circom";
include "./privToPubKey.circom";
include "./stateLeafAndBallotTransformer.circom";
include "./trees/incrementalQuinTree.circom";
include "../node_modules/circomlib/circuits/mux1.circom";
//include "../node_modules/circomlib/circuits/comparators.circom";

template ProcessMessages(
    stateTreeDepth,
    msgTreeDepth,
    msgBatchDepth,
    voteOptionTreeDepth
) {

    // stateTreeDepth: the depth of the state tree
    // msgTreeDepth: the depth of the message tree
    // msgBatchDepth: the depth of the shortest tree that can fit all the
    //                  messages
    // voteOptionTreeDepth: depth of the vote option tree

    var MSG_LENGTH = 8; // iv and data
    var TREE_ARITY = 5;
    var batchSize = TREE_ARITY ** msgBatchDepth;
    var PACKED_CMD_LENGTH = 4;

    var BALLOT_LENGTH = 2;
    var BALLOT_NONCE_IDX = 0;
    var BALLOT_VO_ROOT_IDX = 1;

    var STATE_LEAF_LENGTH = 3;
    var STATE_LEAF_PUB_X_IDX = 0;
    var STATE_LEAF_PUB_Y_IDX = 1;
    var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;
    
    // CONSIDER: sha256 hash any values from the contract, pass in the hash
    // as a public input, and pass in said values as private inputs. This saves
    // a lot of gas for the verifier at the cost of constraints for the prover.

    //  ----------------------------------------------------------------------- 
    // The only public input, which is the SHA256 hash of a values provided
    // by the contract
    signal input inputHash;
    signal private input packedVals;

    signal maxVoteOptions;
    signal maxUsers;

    // The existing message root
    signal input msgRoot;

    // The messages
    signal private input msgs[batchSize][MSG_LENGTH];

    // The message Merkle proofs
    signal private input msgSubrootPathElements[msgTreeDepth - msgBatchDepth][TREE_ARITY - 1];
    // The index of the first message leaf in the batch, inclusive. Note that
    // messages are processed in reverse order, so this is not be the index of
    // the first message to process (unless there is only 1 message)
    signal batchStartIndex;

    // The index of the last message leaf in the batch to process, exclusive.
    // This value may be less than batchStartIndex + batchSize if this batch is
    // the last batch and the total number of mesages is not a multiple of the
    // batch size.
    signal batchEndIndex;

    // The coordinator's public key
    signal private input coordPrivKey;

    // The cooordinator's public key from the contract.
    signal input coordPubKey[2];

    // The ECDH public key per message
    signal private input encPubKeys[batchSize][2];

    signal input currentStateRoot;
    signal private input currentStateLeaves[batchSize][STATE_LEAF_LENGTH];
    signal private input currentStateLeavesPathElements[batchSize][stateTreeDepth][TREE_ARITY - 1];

    signal input currentBallotRoot;
    signal private input currentBallots[batchSize][BALLOT_LENGTH];
    signal private input currentBallotsPathElements[batchSize][stateTreeDepth][TREE_ARITY - 1];

    signal private input currentVoteWeights[batchSize];
    signal private input currentVoteWeightsPathElements[batchSize][voteOptionTreeDepth][TREE_ARITY - 1];

    signal private input newVoteOptionTreeRoots[batchSize];
    signal private input newVoteWeightsPathElements[batchSize][voteOptionTreeDepth][TREE_ARITY - 1];

    signal private input zerothStateLeafHash;
    signal private input zerothStateLeafPathElements[stateTreeDepth][TREE_ARITY - 1];
    signal private input zerothBallotHash;
    signal private input zerothBallotPathElements[stateTreeDepth][TREE_ARITY - 1];

    var msgTreeZeroValue = 8370432830353022751713833565135785980866757267633941821328460903436894336785;

    // Verify "public" inputs and assign unpacked values
    component inputHasher = ProcessMessagesInputHasher();
    inputHasher.packedVals <== packedVals;
    inputHasher.coordPubKey[0] <== coordPubKey[0];
    inputHasher.coordPubKey[1] <== coordPubKey[1];
    inputHasher.msgRoot <== msgRoot;
    inputHasher.currentStateRoot <== currentStateRoot;
    inputHasher.currentBallotRoot <== currentBallotRoot;

    inputHasher.maxVoteOptions ==> maxVoteOptions;
    inputHasher.maxUsers ==> maxUsers;
    inputHasher.batchStartIndex ==> batchStartIndex;
    inputHasher.batchEndIndex ==> batchEndIndex;
    inputHasher.hash === inputHash;

    //  ----------------------------------------------------------------------- 
    //      0. Ensure that the maximum vote options signal is valid and whether
    //      the maximum users signal is valid
    component maxVoValid = LessEqThan(32);
    maxVoValid.in[0] <== maxVoteOptions;
    maxVoValid.in[1] <== TREE_ARITY ** voteOptionTreeDepth;
    maxVoValid.out === 1;

    component maxUsersValid = LessEqThan(32);
    maxUsersValid.in[0] <== maxUsers;
    maxUsersValid.in[1] <== TREE_ARITY ** stateTreeDepth;
    maxUsersValid.out === 1;

    //  ----------------------------------------------------------------------- 
    //      1. Check whether each message exists in the message tree. Throw if
    //         otherwise (aka create a constraint that prevents such a proof).

    //  To save constraints, compute the subroot of the messages and check
    //  whether the subroot is a member of the message tree. This means that
    //  batchSize must be the message tree arity raised to some power
    // (e.g. 5 ^ n)

    component msgBatchLeavesExists = QuinBatchLeavesExists(msgTreeDepth, msgBatchDepth);
    msgBatchLeavesExists.root <== msgRoot;

    // Hash each Message so we can check its existence in the Message tree
    // later
    component messageHashers[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        messageHashers[i] = MessageHasher();
        for (var j = 0; j < MSG_LENGTH; j ++) {
            messageHashers[i].in[j] <== msgs[i][j];
        }
    }

    // If batchEndIndex - batchStartIndex < batchSize, the remaining
    // message hashes should be the zero value.
    // e.g. [m, z, z, z, z] if there is only 1 real message in the batch
    // This allows us to have a batch of messages which is only partially
    // full.
    component lt[batchSize];
    component muxes[batchSize];

    for (var i = 0; i < batchSize; i ++) {
        lt[i] = LessEqThan(32);
        lt[i].in[0] <== batchStartIndex + i;
        lt[i].in[1] <== batchEndIndex;

        muxes[i] = Mux1();
        muxes[i].s <== lt[i].out;
        muxes[i].c[0] <== msgTreeZeroValue;
        muxes[i].c[1] <== messageHashers[i].hash;
        msgBatchLeavesExists.leaves[i] <== muxes[i].out;
    }

    for (var i = 0; i < msgTreeDepth - msgBatchDepth; i ++) {
        for (var j = 0; j < TREE_ARITY - 1; j ++) {
            msgBatchLeavesExists.path_elements[i][j] <== msgSubrootPathElements[i][j];
        }
    }

    // Assign values to msgBatchLeavesExists.path_index. Since
    // msgBatchLeavesExists tests for the existence of a subroot, the length of
    // the proof is the last n elements of a proof from the root to a leaf
    // where n = msgTreeDepth - msgBatchDepth
    // e.g. if batchStartIndex = 25, msgTreeDepth = 4, msgBatchDepth = 2
    // msgBatchLeavesExists.path_index should be:
    // [1, 0]
    component msgBatchPathIndices = QuinGeneratePathIndices(msgTreeDepth);
    msgBatchPathIndices.in <== batchStartIndex;
    for (var i = msgBatchDepth; i < msgTreeDepth; i ++) {
        msgBatchLeavesExists.path_index[i - msgBatchDepth] <== msgBatchPathIndices.out[i];
    }

    //  ----------------------------------------------------------------------- 
    //     2. Decrypt each Message to a Command

    // MessageToCommand derives the ECDH shared key from the coordinator's
    // private key and the message's ephemeral public key. Next, it uses this
    // shared key to decrypt a Message to a Command.

    // Ensure that the coordinator's public key from the contract is correct
    // based on the given private key - that is, the prover knows the
    // coordinator's private key.
    component derivedPubKey = PrivToPubKey();
    derivedPubKey.privKey <== coordPrivKey;
    derivedPubKey.pubKey[0] === coordPubKey[0];
    derivedPubKey.pubKey[1] === coordPubKey[1];

    // Decrypt each Message into a Command
    component commands[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        commands[i] = MessageToCommand();
        commands[i].encPrivKey <== coordPrivKey;
        commands[i].encPubKey[0] <== encPubKeys[i][0];
        commands[i].encPubKey[1] <== encPubKeys[i][1];
        for (var j = 0; j < MSG_LENGTH; j ++) {
            commands[i].message[j] <== msgs[i][j];
        }
    }

    //  ----------------------------------------------------------------------- 
    //    3. Check that each state leaf is in the current state tree
    // Hash each original state leaf
    component currentStateLeafHashers[batchSize];
    for (var i = 0; i < batchSize; i++) {
        currentStateLeafHashers[i] = Hasher3();
        for (var j = 0; j < STATE_LEAF_LENGTH; j++) {
            currentStateLeafHashers[i].in[j] <== currentStateLeaves[i][j];
        }
    }

    component currentStateLeavesPathIndices[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        currentStateLeavesPathIndices[i] = QuinGeneratePathIndices(stateTreeDepth);
        currentStateLeavesPathIndices[i].in <== commands[i].stateIndex;
    }

    // For each Command (a decrypted Message), prove knowledge of the state
    // leaf and its membership in the current state root.
    component currentStateLeavesQle[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        currentStateLeavesQle[i] = QuinLeafExists(stateTreeDepth);
        currentStateLeavesQle[i].root <== currentStateRoot;
        currentStateLeavesQle[i].leaf <== currentStateLeafHashers[i].hash;
        for (var j = 0; j < stateTreeDepth; j ++) {
            currentStateLeavesQle[i].path_index[j] <== currentStateLeavesPathIndices[i].out[j];
            for (var k = 0; k < TREE_ARITY - 1; k++) {
                currentStateLeavesQle[i].path_elements[j][k] <== currentStateLeavesPathElements[i][j][k];
            }
        }
    }

    //  ----------------------------------------------------------------------- 
    //    4. Check whether each ballot exists in the original ballot tree
    component currentBallotsHashers[batchSize];
    component currentBallotsQle[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        currentBallotsHashers[i] = HashLeftRight();
        currentBallotsHashers[i].left <== currentBallots[i][BALLOT_NONCE_IDX];
        currentBallotsHashers[i].right <== currentBallots[i][BALLOT_VO_ROOT_IDX];

        currentBallotsQle[i] = QuinLeafExists(stateTreeDepth);
        currentBallotsQle[i].root <== currentBallotRoot;
        currentBallotsQle[i].leaf <== currentBallotsHashers[i].hash;
        for (var j = 0; j < stateTreeDepth; j ++) {
            currentBallotsQle[i].path_index[j] <== currentStateLeavesPathIndices[i].out[j];
            for (var k = 0; k < TREE_ARITY - 1; k++) {
                currentBallotsQle[i].path_elements[j][k] <== currentBallotsPathElements[i][j][k];
            }
        }
    }

    //  ----------------------------------------------------------------------- 
    //    5. Check whether the existing vote weight value is a member of each
    //    corresponding Ballot's vote option tree.
    component currentVoteWeightsQle[batchSize];
    component currentVoteWeightsPathIndices[batchSize];
    for (var i = 0; i < batchSize; i ++) {

        currentVoteWeightsPathIndices[i] = QuinGeneratePathIndices(voteOptionTreeDepth);
        currentVoteWeightsPathIndices[i].in <== commands[i].voteOptionIndex;

        currentVoteWeightsQle[i] = QuinLeafExists(voteOptionTreeDepth);
        currentVoteWeightsQle[i].root <== currentBallots[i][BALLOT_VO_ROOT_IDX];
        currentVoteWeightsQle[i].leaf <== currentVoteWeights[i];
        for (var j = 0; j < voteOptionTreeDepth; j ++) {
            currentVoteWeightsQle[i].path_index[j] <== currentVoteWeightsPathIndices[i].out[j];
            for (var k = 0; k < TREE_ARITY - 1; k++) {
                currentVoteWeightsQle[i].path_elements[j][k] <== currentVoteWeightsPathElements[i][j][k];
            }
        }
    }

    //  ----------------------------------------------------------------------- 
    //    6. Check whether the new vote weight value is a member of the new
    //    vote option tree.
    component newVoteWeightsQle[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        newVoteWeightsQle[i] = QuinLeafExists(voteOptionTreeDepth);
        newVoteWeightsQle[i].root <== newVoteOptionTreeRoots[i];
        newVoteWeightsQle[i].leaf <== commands[i].newVoteWeight;
        for (var j = 0; j < voteOptionTreeDepth; j ++) {
            newVoteWeightsQle[i].path_index[j] <== currentVoteWeightsPathIndices[i].out[j];
            for (var k = 0; k < TREE_ARITY - 1; k++) {
                newVoteWeightsQle[i].path_elements[j][k] <== newVoteWeightsPathElements[i][j][k];
            }
        }
    }

    //  ----------------------------------------------------------------------- 
    //     7. Transform state leaves. For each command[i], stateLeaf[i], and
    //     ballot[i]:
    //       - Prove knowledge of a state leaf at command[i].stateIndex
    //       - Generate a new leaf and hash it
    //       - Generate the next intermediate state root
    component transformers[batchSize];
    for (var i = batchSize - 1; i >= 0; i --) {
        transformers[i] = StateLeafAndBallotTransformer();
        transformers[i].maxUsers <== maxUsers;
        transformers[i].maxVoteOptions <== maxVoteOptions;
        transformers[i].slPubKey[STATE_LEAF_PUB_X_IDX] <== currentStateLeaves[i][STATE_LEAF_PUB_X_IDX];
        transformers[i].slPubKey[STATE_LEAF_PUB_Y_IDX] <== currentStateLeaves[i][STATE_LEAF_PUB_Y_IDX];
        transformers[i].slVoiceCreditBalance <== currentStateLeaves[i][STATE_LEAF_VOICE_CREDIT_BALANCE_IDX];
        transformers[i].ballotNonce <== currentBallots[i][BALLOT_NONCE_IDX];
        transformers[i].ballotVoteOptionRoot <== currentBallots[i][BALLOT_VO_ROOT_IDX];
        transformers[i].ballotCurrentVotesForOption <== currentVoteWeights[i];
        transformers[i].cmdStateIndex <== commands[i].stateIndex;
        transformers[i].cmdNewPubKey[0] <== commands[i].newPubKey[0];
        transformers[i].cmdNewPubKey[1] <== commands[i].newPubKey[1];
        transformers[i].cmdVoteOptionIndex <== commands[i].voteOptionIndex;
        transformers[i].cmdNewVoteWeight <== commands[i].newVoteWeight;
        transformers[i].cmdNonce <== commands[i].nonce;
        transformers[i].cmdPollId <== commands[i].pollId;
        transformers[i].cmdSalt <== commands[i].salt;
        transformers[i].cmdSigR8[0] <== commands[i].sigR8[0];
        transformers[i].cmdSigR8[1] <== commands[i].sigR8[1];
        transformers[i].cmdSigS <== commands[i].sigS;
        transformers[i].updatedBallotVoteOptionRoot <== newVoteOptionTreeRoots[i];
        for (var j = 0; j < PACKED_CMD_LENGTH; j ++) {
            transformers[i].packedCommand[j] <== commands[i].packedCommandOut[j];
        }
    }

    component newStateLeavesHashers[batchSize];
    component newStateLeavesQip[batchSize];

    component newBallotsHashers[batchSize];
    component newBallotsQip[batchSize];

    signal newStateRoots[batchSize];
    signal newBallotsRoots[batchSize];

    for (var i = 0; i < batchSize; i ++) {
        // Hash each new state leaf and ballot
        newStateLeavesHashers[i] = Hasher3();
        newStateLeavesHashers[i].in[STATE_LEAF_PUB_X_IDX] <== transformers[i].newSlPubKey[STATE_LEAF_PUB_X_IDX];
        newStateLeavesHashers[i].in[STATE_LEAF_PUB_Y_IDX] <== transformers[i].newSlPubKey[STATE_LEAF_PUB_Y_IDX];
        newStateLeavesHashers[i].in[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX] <== transformers[i].newSlVoiceCreditBalance;

        newBallotsHashers[i] = HashLeftRight();
        newBallotsHashers[i].left <== transformers[i].newBallotNonce;
        newBallotsHashers[i].right <== transformers[i].newBallotVoteOptionRoot;

        newStateLeavesQip[i] = QuinTreeInclusionProof(stateTreeDepth);
        newBallotsQip[i] = QuinTreeInclusionProof(stateTreeDepth);

        newStateLeavesQip[i].leaf <== newStateLeavesHashers[i].hash;
        newBallotsQip[i].leaf <== newBallotsHashers[i].hash;

        for (var j = 0; j < stateTreeDepth; j ++) {
            newStateLeavesQip[i].path_index[j] <== currentStateLeavesPathIndices[i].out[j];
            newBallotsQip[i].path_index[j] <== currentStateLeavesPathIndices[i].out[j];
            for (var k = 0; k < TREE_ARITY - 1; k ++) {
                newStateLeavesQip[i].path_elements[j][k] <== currentStateLeavesPathElements[i][j][k];
                newBallotsQip[i].path_elements[j][k] <== currentBallotsPathElements[i][j][k];
            }
        }
        newStateRoots[i] <== newStateLeavesQip[i].root;
        newBallotsRoots[i] <== newBallotsQip[i].root;
    }

    //  ----------------------------------------------------------------------- 
    // 8. Generate the final state tree root with the zeroth leaf set to a
    // random value

    component zerothSlQip = QuinTreeInclusionProof(stateTreeDepth);
    zerothSlQip.leaf <== zerothStateLeafHash;
    for (var i = 0; i < stateTreeDepth; i ++) {
        zerothSlQip.path_index[i] <== 0;
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            zerothSlQip.path_elements[i][j] <== zerothStateLeafPathElements[i][j];
        }
    }
    signal output newStateRoot;
    newStateRoot <== zerothSlQip.root;

    //  ----------------------------------------------------------------------- 
    // 9. Generate the final ballot tree root with the zeroth leaf set to a
    // random value

    component zerothBallotQip = QuinTreeInclusionProof(stateTreeDepth);
    zerothBallotQip.leaf <== zerothBallotHash;
    for (var i = 0; i < stateTreeDepth; i ++) {
        zerothBallotQip.path_index[i] <== 0;
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            zerothBallotQip.path_elements[i][j] <== zerothBallotPathElements[i][j];
        }
    }
    signal output newBallotRoot;
    newBallotRoot <== zerothBallotQip.root;
}

template ProcessMessagesInputHasher() {
    // Combine the following into 1 input element:
    // - maxVoteOptions (50 bits)
    // - maxUsers (50 bits)
    // - batchStartIndex (50 bits)
    // - batchEndIndex (50 bits)

    // Hash coordPubKey:
    // - coordPubKeyHash 

    // Other inputs that can't be compressed or packed:
    // - msgRoot, currentStateRoot, currentBallotRoot

    // Total number of inputs = 1 + 1 + 4 = 5

    // Also ensure that packedVals is valid

    signal input packedVals;
    signal input coordPubKey[2];
    signal input msgRoot;
    signal input currentStateRoot;
    signal input currentBallotRoot;

    signal output maxVoteOptions;
    signal output maxUsers;
    signal output batchStartIndex;
    signal output batchEndIndex;
    signal output hash;
    
    // 1. Unpack packedVals and ensure that it is valid
    component unpack = UnpackElement(4);
    unpack.in <== packedVals;

    maxVoteOptions <== unpack.out[3];
    maxUsers <== unpack.out[2];
    batchStartIndex <== unpack.out[1];
    batchEndIndex <== unpack.out[0];

    // 2. Hash coordPubKey
    component pubKeyHasher = HashLeftRight();
    pubKeyHasher.left <== coordPubKey[0];
    pubKeyHasher.right <== coordPubKey[1];

    // 3. Hash the 5 inputs with SHA256
    component hasher = Sha256Hasher5();
    hasher.in[0] <== packedVals;
    hasher.in[1] <== pubKeyHasher.hash;
    hasher.in[2] <== msgRoot;
    hasher.in[3] <== currentStateRoot;
    hasher.in[4] <== currentBallotRoot;

    hash <== hasher.hash;
}
