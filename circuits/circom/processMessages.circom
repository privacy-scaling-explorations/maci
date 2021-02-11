include "./messageHasher.circom";
include "./messageToCommand.circom";
include "./privToPubKey.circom";
include "./stateLeafAndBallotTransformer.circom";
include "./trees/incrementalQuinTree.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

/*
 * Proves the correctness of processing a batch of messages.
 */
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

    assert(msgTreeDepth >= msgBatchDepth);

    var TREE_ARITY = 5;
    var batchSize = TREE_ARITY ** msgBatchDepth;

    var MSG_LENGTH = 8; // iv and data
    var PACKED_CMD_LENGTH = 4;

    var STATE_LEAF_LENGTH = 3;
    var BALLOT_LENGTH = 2;

    var BALLOT_NONCE_IDX = 0;
    var BALLOT_VO_ROOT_IDX = 1;

    var STATE_LEAF_PUB_X_IDX = 0;
    var STATE_LEAF_PUB_Y_IDX = 1;
    var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;
    
    // Note that we sha256 hash some values from the contract, pass in the hash
    // as a public input, and pass in said values as private inputs. This saves
    // a lot of gas for the verifier at the cost of constraints for the prover.

    //  ----------------------------------------------------------------------- 
    // The only public input, which is the SHA256 hash of a values provided
    // by the contract
    signal input inputHash;
    signal private input packedVals;

    signal numSignUps;
    signal maxVoteOptions;

    // The existing message root
    signal private input msgRoot;

    // The messages
    signal private input msgs[batchSize][MSG_LENGTH];

    // The message leaf Merkle proofs
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
    signal private input coordPubKey[2];

    // The ECDH public key per message
    signal private input encPubKeys[batchSize][2];

    // The state root before it is processed
    signal private input currentStateRoot;

    // The state leaves upon which messages are applied.
    //     transform(currentStateLeaf[4], message5) => newStateLeaf4
    //     transform(currentStateLeaf[3], message4) => newStateLeaf3
    //     transform(currentStateLeaf[2], message3) => newStateLeaf2
    //     transform(currentStateLeaf[1], message1) => newStateLeaf1
    //     transform(currentStateLeaf[0], message0) => newStateLeaf0
    //     ...
    // Likewise, currentStateLeavesPathElements contains the Merkle path to
    // each incremental new state root.
    signal private input currentStateLeaves[batchSize][STATE_LEAF_LENGTH];
    signal private input currentStateLeavesPathElements[batchSize][stateTreeDepth][TREE_ARITY - 1];

    // The commitment to the state root, ballot root, and a salt
    signal private input currentSbCommitment;
    signal private input currentSbSalt;

    // The ballots before any messages are processed
    signal private input currentBallotRoot;

    // Intermediate ballots, like currentStateLeaves
    signal private input currentBallots[batchSize][BALLOT_LENGTH];
    signal private input currentBallotsPathElements[batchSize][stateTreeDepth][TREE_ARITY - 1];

    signal private input currentVoteWeights[batchSize];
    signal private input currentVoteWeightsPathElements[batchSize][voteOptionTreeDepth][TREE_ARITY - 1];

    signal private input newSbCommitment;
    signal private input newSbSalt;

    var msgTreeZeroValue = 8370432830353022751713833565135785980866757267633941821328460903436894336785;

    // Verify currentSbCommitment
    component currentSbCommitmentHasher = Hasher3(); 
    currentSbCommitmentHasher.in[0] <== currentStateRoot;
    currentSbCommitmentHasher.in[1] <== currentBallotRoot;
    currentSbCommitmentHasher.in[2] <== currentSbSalt;
    currentSbCommitmentHasher.hash === currentSbCommitment;

    // Verify "public" inputs and assign unpacked values
    component inputHasher = ProcessMessagesInputHasher();
    inputHasher.packedVals <== packedVals;
    inputHasher.coordPubKey[0] <== coordPubKey[0];
    inputHasher.coordPubKey[1] <== coordPubKey[1];
    inputHasher.msgRoot <== msgRoot;
    inputHasher.currentSbCommitment <== currentSbCommitment;

    inputHasher.maxVoteOptions ==> maxVoteOptions;
    inputHasher.numSignUps ==> numSignUps;
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

    component numSignUpsValid = LessEqThan(32);
    numSignUpsValid.in[0] <== numSignUps;
    numSignUpsValid.in[1] <== TREE_ARITY ** stateTreeDepth;
    numSignUpsValid.out === 1;

    // Hash each Message so we can check its existence in the Message tree
    component messageHashers[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        messageHashers[i] = MessageHasher();
        for (var j = 0; j < MSG_LENGTH; j ++) {
            messageHashers[i].in[j] <== msgs[i][j];
        }
    }

    //  ----------------------------------------------------------------------- 
    //  Check whether each message exists in the message tree. Throw if
    //  otherwise (aka create a constraint that prevents such a proof).

    //  To save constraints, compute the subroot of the messages and check
    //  whether the subroot is a member of the message tree. This means that
    //  batchSize must be the message tree arity raised to some power
    // (e.g. 5 ^ n)

    component msgBatchLeavesExists = QuinBatchLeavesExists(msgTreeDepth, msgBatchDepth);
    msgBatchLeavesExists.root <== msgRoot;

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
    //  Decrypt each Message to a Command

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

    signal stateRoots[batchSize + 1];
    signal ballotRoots[batchSize + 1];

    stateRoots[batchSize] <== currentStateRoot;
    ballotRoots[batchSize] <== currentBallotRoot;

    //  ----------------------------------------------------------------------- 
    //  Process messages in reverse order
    component processors[batchSize];
    for (var i = batchSize - 1; i >= 0; i --) {
        processors[i] = ProcessOne(stateTreeDepth, voteOptionTreeDepth);

        processors[i].numSignUps <== numSignUps;
        processors[i].maxVoteOptions <== maxVoteOptions;

        processors[i].currentStateRoot <== stateRoots[i + 1];
        processors[i].currentBallotRoot <== ballotRoots[i + 1];

        for (var j = 0; j < STATE_LEAF_LENGTH; j ++) {
            processors[i].stateLeaf[j] <== currentStateLeaves[i][j];
        }

        for (var j = 0; j < BALLOT_LENGTH; j ++) {
            processors[i].ballot[j] <== currentBallots[i][j];
        }

        for (var j = 0; j < stateTreeDepth; j ++) {
            for (var k = 0; k < TREE_ARITY - 1; k ++) {

                processors[i].stateLeafPathElements[j][k] 
                    <== currentStateLeavesPathElements[i][j][k];

                processors[i].ballotPathElements[j][k]
                    <== currentBallotsPathElements[i][j][k];
            }
        }

        processors[i].currentVoteWeight <== currentVoteWeights[i];

        for (var j = 0; j < voteOptionTreeDepth; j ++) {
            for (var k = 0; k < TREE_ARITY - 1; k ++) {
                processors[i].currentVoteWeightsPathElements[j][k]
                    <== currentVoteWeightsPathElements[i][j][k];
            }
        }

        processors[i].cmdStateIndex <== commands[i].stateIndex;
        processors[i].cmdNewPubKey[0] <== commands[i].newPubKey[0];
        processors[i].cmdNewPubKey[1] <== commands[i].newPubKey[1];
        processors[i].cmdVoteOptionIndex <== commands[i].voteOptionIndex;
        processors[i].cmdNewVoteWeight <== commands[i].newVoteWeight;
        processors[i].cmdNonce <== commands[i].nonce;
        processors[i].cmdPollId <== commands[i].pollId;
        processors[i].cmdSalt <== commands[i].salt;
        processors[i].cmdSigR8[0] <== commands[i].sigR8[0];
        processors[i].cmdSigR8[1] <== commands[i].sigR8[1];
        processors[i].cmdSigS <== commands[i].sigS;
        for (var j = 0; j < PACKED_CMD_LENGTH; j ++) {
            processors[i].packedCmd[j] <== commands[i].packedCommandOut[j];
        }

        stateRoots[i] <== processors[i].newStateRoot;
        ballotRoots[i] <== processors[i].newBallotRoot;
    }
    /*signal output debug[batchSize];*/
    /*for (var i = 0; i < batchSize; i ++) {*/
        /*debug[i] <== processors[i].debug;*/
    /*}*/

    component sbCommitmentHasher = Hasher3();
    sbCommitmentHasher.in[0] <== stateRoots[0];
    sbCommitmentHasher.in[1] <== ballotRoots[0];
    sbCommitmentHasher.in[2] <== newSbSalt;

    sbCommitmentHasher.hash === newSbCommitment;
}

template ProcessOne(stateTreeDepth, voteOptionTreeDepth) {
    /*
        transform(currentStateLeaves0, cmd0) -> newStateLeaves0, isValid0
        genIndices(isValid0, cmd0) -> pathIndices0
        verify(currentStateRoot, pathElements0, pathIndices0, currentStateLeaves0)
        qip(newStateLeaves0, pathElements0) -> newStateRoot0
    */
    var STATE_LEAF_LENGTH = 3;
    var BALLOT_LENGTH = 2;
    var MSG_LENGTH = 8; // iv and data
    var PACKED_CMD_LENGTH = 4;
    var TREE_ARITY = 5;

    var BALLOT_NONCE_IDX = 0;
    var BALLOT_VO_ROOT_IDX = 1;

    var STATE_LEAF_PUB_X_IDX = 0;
    var STATE_LEAF_PUB_Y_IDX = 1;
    var STATE_LEAF_VOICE_CREDIT_BALANCE_IDX = 2;

    signal input numSignUps;
    signal input maxVoteOptions;

    signal input currentStateRoot;
    signal input currentBallotRoot;

    signal input stateLeaf[STATE_LEAF_LENGTH];
    signal input stateLeafPathElements[stateTreeDepth][TREE_ARITY - 1];

    signal input ballot[BALLOT_LENGTH];
    signal input ballotPathElements[stateTreeDepth][TREE_ARITY - 1];

    signal input currentVoteWeight;
    signal input currentVoteWeightsPathElements[voteOptionTreeDepth][TREE_ARITY - 1];

    signal input cmdStateIndex;
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

    //  ----------------------------------------------------------------------- 
    // 1. Transform a state leaf and a ballot with a command.
    // The result is a new state leaf, a new ballot, and an isValid signal (0
    // or 1)
    component transformer = StateLeafAndBallotTransformer();
    transformer.numSignUps                     <== numSignUps;
    transformer.maxVoteOptions                 <== maxVoteOptions;
    transformer.slPubKey[STATE_LEAF_PUB_X_IDX] <== stateLeaf[STATE_LEAF_PUB_X_IDX];
    transformer.slPubKey[STATE_LEAF_PUB_Y_IDX] <== stateLeaf[STATE_LEAF_PUB_Y_IDX];
    transformer.slVoiceCreditBalance           <== stateLeaf[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX];
    transformer.ballotNonce                    <== ballot[BALLOT_NONCE_IDX];
    transformer.ballotCurrentVotesForOption    <== currentVoteWeight;
    transformer.cmdStateIndex                  <== cmdStateIndex;
    transformer.cmdNewPubKey[0]                <== cmdNewPubKey[0];
    transformer.cmdNewPubKey[1]                <== cmdNewPubKey[1];
    transformer.cmdVoteOptionIndex             <== cmdVoteOptionIndex;
    transformer.cmdNewVoteWeight               <== cmdNewVoteWeight;
    transformer.cmdNonce                       <== cmdNonce;
    transformer.cmdPollId                      <== cmdPollId;
    transformer.cmdSalt                        <== cmdSalt;
    transformer.cmdSigR8[0]                    <== cmdSigR8[0];
    transformer.cmdSigR8[1]                    <== cmdSigR8[1];
    transformer.cmdSigS                        <== cmdSigS;
    for (var i = 0; i < PACKED_CMD_LENGTH; i ++) {
        transformer.packedCommand[i]           <== packedCmd[i];
    }

    //  ----------------------------------------------------------------------- 
    // 2. If isValid is 0, generate indices for leaf 0
    //    Otherwise, generate indices for commmand.stateIndex
    component isValidMux = Mux1();
    isValidMux.s <== transformer.isValid;
    isValidMux.c[0] <== 0;
    isValidMux.c[1] <== cmdStateIndex;

    component stateLeafPathIndices = QuinGeneratePathIndices(stateTreeDepth);
    stateLeafPathIndices.in <== isValidMux.out;

    //  ----------------------------------------------------------------------- 
    // 3. Verify that the original state leaf exists in the given state root
    component stateLeafQle = QuinLeafExists(stateTreeDepth);
    component stateLeafHasher = Hasher3();
    for (var i = 0; i < STATE_LEAF_LENGTH; i++) {
        stateLeafHasher.in[i] <== stateLeaf[i];
    }
    stateLeafQle.leaf <== stateLeafHasher.hash;
    stateLeafQle.root <== currentStateRoot;
    for (var i = 0; i < stateTreeDepth; i ++) {
        stateLeafQle.path_index[i] <== stateLeafPathIndices.out[i];
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            stateLeafQle.path_elements[i][j] <== stateLeafPathElements[i][j];
        }
    }

    //  ----------------------------------------------------------------------- 
    // 4. Verify that the original ballot exists in the given ballot root
    component ballotHasher = HashLeftRight();
    ballotHasher.left <== ballot[BALLOT_NONCE_IDX];
    ballotHasher.right <== ballot[BALLOT_VO_ROOT_IDX];

    component ballotQle = QuinLeafExists(stateTreeDepth);
    ballotQle.leaf <== ballotHasher.hash;
    ballotQle.root <== currentBallotRoot;
    for (var i = 0; i < stateTreeDepth; i ++) {
        ballotQle.path_index[i] <== stateLeafPathIndices.out[i];
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            ballotQle.path_elements[i][j] <== ballotPathElements[i][j];
        }
    }

    //  ----------------------------------------------------------------------- 
    // 5. Verify that currentVoteWeight exists in the ballot's vote option root
    // at cmdVoteOptionIndex
    component currentVoteWeightPathIndices = QuinGeneratePathIndices(voteOptionTreeDepth);
    currentVoteWeightPathIndices.in <== cmdVoteOptionIndex;

    component currentVoteWeightQle = QuinLeafExists(voteOptionTreeDepth);
    currentVoteWeightQle.leaf <== currentVoteWeight;
    currentVoteWeightQle.root <== ballot[BALLOT_VO_ROOT_IDX];
    for (var i = 0; i < voteOptionTreeDepth; i ++) {
        currentVoteWeightQle.path_index[i] <== currentVoteWeightPathIndices.out[i];
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            currentVoteWeightQle.path_elements[i][j] <== currentVoteWeightsPathElements[i][j];
        }
    }

    /*signal output debug;*/
    /*debug <== transformer.isValid;*/

    //  ----------------------------------------------------------------------- 
    // 5.1. Update the ballot's vote option root with the new vote weight
    component newVoteOptionTreeQip = QuinTreeInclusionProof(voteOptionTreeDepth);
    newVoteOptionTreeQip.leaf <== cmdNewVoteWeight;
    for (var i = 0; i < voteOptionTreeDepth; i ++) {
        newVoteOptionTreeQip.path_index[i] <== currentVoteWeightPathIndices.out[i];
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            newVoteOptionTreeQip.path_elements[i][j] <== currentVoteWeightsPathElements[i][j];
        }
    }

    //  ----------------------------------------------------------------------- 
    // 6. Generate a new state root
    component newStateLeafHasher = Hasher3();
    newStateLeafHasher.in[STATE_LEAF_PUB_X_IDX] <== transformer.newSlPubKey[STATE_LEAF_PUB_X_IDX];
    newStateLeafHasher.in[STATE_LEAF_PUB_Y_IDX] <== transformer.newSlPubKey[STATE_LEAF_PUB_Y_IDX];
    newStateLeafHasher.in[STATE_LEAF_VOICE_CREDIT_BALANCE_IDX] <== transformer.newSlVoiceCreditBalance;

    component newStateLeafQip = QuinTreeInclusionProof(stateTreeDepth);
    newStateLeafQip.leaf <== newStateLeafHasher.hash;
    for (var i = 0; i < stateTreeDepth; i ++) {
        newStateLeafQip.path_index[i] <== stateLeafPathIndices.out[i];
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            newStateLeafQip.path_elements[i][j] <== stateLeafPathElements[i][j];
        }
    }
    newStateRoot <== newStateLeafQip.root;

    //  ----------------------------------------------------------------------- 
    // 7. Generate a new ballot root
    component newBallotHasher = HashLeftRight();
    newBallotHasher.left <== transformer.newBallotNonce;
    newBallotHasher.right <== newVoteOptionTreeQip.root;

    component newBallotQip = QuinTreeInclusionProof(stateTreeDepth);
    newBallotQip.leaf <== newBallotHasher.hash;
    for (var i = 0; i < stateTreeDepth; i ++) {
        newBallotQip.path_index[i] <== stateLeafPathIndices.out[i];
        for (var j = 0; j < TREE_ARITY - 1; j++) {
            newBallotQip.path_elements[i][j] <== ballotPathElements[i][j];
        }
    }
    newBallotRoot <== newBallotQip.root;
}

template ProcessMessagesInputHasher() {
    // Combine the following into 1 input element:
    // - maxVoteOptions (50 bits)
    // - numSignUps (50 bits)
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
    signal input currentSbCommitment;

    signal output maxVoteOptions;
    signal output numSignUps;
    signal output batchStartIndex;
    signal output batchEndIndex;
    signal output hash;
    
    // 1. Unpack packedVals and ensure that it is valid
    component unpack = UnpackElement(4);
    unpack.in <== packedVals;

    maxVoteOptions <== unpack.out[3];
    numSignUps <== unpack.out[2];
    batchStartIndex <== unpack.out[1];
    batchEndIndex <== unpack.out[0];

    // 2. Hash coordPubKey
    component pubKeyHasher = HashLeftRight();
    pubKeyHasher.left <== coordPubKey[0];
    pubKeyHasher.right <== coordPubKey[1];

    // 3. Hash the 4 inputs with SHA256
    component hasher = Sha256Hasher4();
    hasher.in[0] <== packedVals;
    hasher.in[1] <== pubKeyHasher.hash;
    hasher.in[2] <== msgRoot;
    hasher.in[3] <== currentSbCommitment;

    hash <== hasher.hash;
}
