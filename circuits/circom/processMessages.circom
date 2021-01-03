include "./messageHasher.circom"
include "./messageToCommand.circom"
include "./privToPubKey.circom"
include "./trees/incrementalQuinTree.circom";
include "../node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template ProcessMessages(
    stateTreeDepth,
    msgTreeDepth,
    msgSubTreeDepth,
    voteOptionTreeDepth
) {

    // stateTreeDepth: the depth of the state tree
    // msgTreeDepth: the depth of the message tree
    // msgSubTreeDepth: the depth of the shortest tree that can fit all the
    //                  messages
    // voteOptionTreeDepth: depth of the vote option tree

    var MSG_LENGTH = 8; // iv and data
    var BALLOT_LENGTH = 2;
    var TREE_ARITY = 5;
    var batchSize = TREE_ARITY ** msgSubTreeDepth;
    
    // CONSIDER: sha256 hash any values from the contract, pass in the hash
    // as a public input, and pass in said values as private inputs. This saves
    // a lot of gas for the verifier at the cost of constraints for the prover.

    // The existing message root
    signal input msgRoot;

    // The new state tree root
    /*signal output newStateRoot;*/

    //  ----------------------------------------------------------------------- 
    //      1. Check whether each message exists in the message tree. Throw if
    //         otherwise.

    //  To save constraints, compute the subroot of the messages and check
    //  whether the subroot is a member of the message tree. This means that
    //  batchSize must be the message tree arity raised to some power (e.g. 5 ^

    signal private input msgs[batchSize][MSG_LENGTH];
    signal input msgSubrootPathElements[msgTreeDepth - msgSubTreeDepth][TREE_ARITY - 1];

    // The index of the first message leaf in the batch, inclusive. Note that
    // messages are processed in reverse order, so this is not be the index of
    // the first message to process (unless there is only 1 message)
    signal input batchStartIndex;

    // The index of the last message leaf in the batch to process, exclusive.
    // This value may be less than batchStartIndex + batchSize if this batch is
    // the last batch and the total number of mesages is not a multiple of the
    // batch size.
    signal input batchEndIndex;

    signal input msgTreeZeroValue;
    component msgBatchLeavesExists = QuinBatchLeavesExists(msgTreeDepth, msgSubTreeDepth);
    msgBatchLeavesExists.root <== msgRoot;

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

    for (var i = 0; i < msgTreeDepth - msgSubTreeDepth; i ++) {
        for (var j = 0; j < TREE_ARITY - 1; j ++) {
            msgBatchLeavesExists.path_elements[i][j] <== msgSubrootPathElements[i][j];
        }
    }

    // Assign values to msgBatchLeavesExists.path_index
    // e.g. if batchStartIndex = 25, msgTreeDepth = 4, msgSubtreeDepth = 2
    // msgBatchLeavesExists.path_index should be:
    // [1, 0]
    component msgBatchPathIndices = QuinGeneratePathIndices(msgTreeDepth);
    msgBatchPathIndices.in <== batchStartIndex;
    for (var i = msgSubTreeDepth; i < msgTreeDepth; i ++) {
        msgBatchLeavesExists.path_index[i - msgSubTreeDepth] <== msgBatchPathIndices.out[i];
    }

    //  ----------------------------------------------------------------------- 
    //     2. Decrypt each Message to a Command

    // Derive the ECDH shared key from the coordinator's private key and the
    // message's ephemeral public key. Also ensure that the coordinator's
    // public key from the contract is correct based on the given private key -
    // that is, the prover knows the coordinator's private key.

    // The coordinator's public key
    signal private input coordPrivKey;

    // The cooordinator's public key from the contract.
    signal input coordPubKey[2];

    // The ECDH public key per message
    signal input encPubKeys[batchSize][2];

    // These checks ensure that the prover knows the coordinator's private key
    component derivedPubKey = PrivToPubKey();
    derivedPubKey.privKey <== coordPrivKey;
    derivedPubKey.pubKey[0] === coordPubKey[0];
    derivedPubKey.pubKey[1] === coordPubKey[1];

    // Decrypt each Command into a Message
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

    /*var STATE_LEAF_LENGTH = 3;*/
    /*signal input currentStateRoot;*/

    // The existing state root
    /*signal private input currentStateLeaves[batchSize][STATE_LEAF_LENGTH];*/
    /*signal private input currentStateLeavesPathElements[batchSize][stateTreeDepth][TREE_ARITY - 1];*/

    /*// Hash each original state leaf*/
    /*component currentStateLeafHashers[batchSize];*/
    /*for (var i = 0; i < batchSize; i++) {*/
        /*currentStateLeafHashers[i] = Hasher3();*/
        /*for (var j = 0; j < STATE_LEAF_LENGTH; j++) {*/
            /*currentStateLeafHashers[i].in[j] <== currentStateLeaves[i][j];*/
        /*}*/
    /*}*/

    /*component currentStateLeavesPathIndices[batchSize];*/
    /*for (var i = 0; i < batchSize; i ++) {*/
        /*currentStateLeavesPathIndices[i] = QuinGeneratePathIndices(stateTreeDepth);*/
        /*currentStateLeavesPathIndices[i].in <== commands[i].stateIndex;*/
    /*}*/

    /*// For each Command (a decrypted Message), prove knowledge of the state*/
    /*// leaf and its membership in the current state root.*/
    /*component currentStateLeavesQle[batchSize];*/
    /*for (var i = 0; i < batchSize; i ++) {*/
        /*currentStateLeavesQle[i] = QuinLeafExists(stateTreeDepth);*/
        /*currentStateLeavesQle[i].root <== currentStateRoot;*/
        /*currentStateLeavesQle[i].leaf <== currentStateLeafHashers[i].hash;*/
        /*for (var j = 0; j < stateTreeDepth; j ++) {*/
            /*currentStateLeavesQle[i].path_index[j] <== currentStateLeavesPathIndices[i].out[j];*/
            /*for (var k = 0; k < TREE_ARITY - 1; k++) {*/
                /*currentStateLeavesQle[i].path_elements[j][k] <== currentStateLeavesPathElements[i][j][k];*/
            /*}*/
        /*}*/
    /*}*/

    /*//  ----------------------------------------------------------------------- */
    /*//    4. Check whether each ballot exists in the original ballot tree*/
    
    /*// The existing ballot root*/
    /*signal input currentBallotRoot*/
    /*signal private input currentBallots[batchSize][BALLOT_LENGTH];*/
    /*signal private input currentBallotsPathElements[batchSize][stateTreeDepth][TREE_ARITY - 1];*/

    /*component currentBallotsHashers[batchSize];*/

    /*component currentBallotsQle[batchSize];*/
    /*for (var i = 0; i < batchSize; i ++) {*/
        /*currentBallotsHashers[i] = HashLeftRight();*/
        /*currentBallotsHashers[i].left <== currentBallots[i][0];*/
        /*currentBallotsHashers[i].right <== currentBallots[i][1];*/

        /*currentBallotsQle[i] = QuinLeafExists(stateTreeDepth);*/
        /*currentBallotsQle[i].root <== currentBallotRoot;*/
        /*currentBallotsQle[i].leaf <== currentBallotsHashers[i].hash;*/
        /*for (var j = 0; j < stateTreeDepth; j ++) {*/
            /*currentBallotsQle[i].path_index[j] <== currentStateLeavesPathIndices[i].out[j];*/
            /*for (var k = 0; k < TREE_ARITY - 1; k++) {*/
                /*currentBallotsQle[i].path_elements[j][k] <== currentBallotsPathElements[i][j][k];*/
            /*}*/
        /*}*/
    /*}*/


    // The new ballot root
    /*signal output newBallotRoot;*/

    /*//  ----------------------------------------------------------------------- */
    /*// 5. Check whether each message is valid or not*/
    /*// This entails the following checks:*/
    /*//     a) Whether the max state tree index is correct*/
    /*//     b) Whether the max vote option tree index is correct*/
    /*//     c) Whether the nonce is correct*/
    /*//     d) Whether the signature is correct*/
}
