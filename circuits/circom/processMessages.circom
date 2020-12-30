include "./ecdh.circom"
include "./decrypt.circom"
include "./messageHasher.circom"
include "./privToPubKey.circom"
include "./trees/incrementalQuinTree.circom";

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
    var TREE_ARITY = 5;
    var batchSize = TREE_ARITY ** msgSubTreeDepth;
    
    // CONSIDER: sha256 hash any values from the contract, pass in the hash
    // as a public input, and pass in said values as private inputs. This saves
    // a lot of gas for the verifier at the cost of constraints for the prover.

    // The existing state root
    signal input currentStateRoot;

    // The existing message root
    signal input msgRoot;

    // The new state tree root
    /*signal output newStateRoot;*/

    /**************************************************************************
        1. Check whether each message exists in the message tree. Throw if
        otherwise.

        To save constraints, compute the subroot of the messages and check
        whether the subroot is a member of the message tree. This means that
        batchSize must be the message tree arity raised to some power (e.g. 5 ^
        2)
    */

    signal private input msgs[batchSize][MSG_LENGTH];
    signal input msgSubrootPathElements[msgTreeDepth - msgSubTreeDepth][TREE_ARITY - 1];

    // The index of the first message leaf in the batch, inclusive. Note that
    // messages are processed in reverse order, so this is not be the index of
    // the first message to process (unless there is only 1 message)
    signal input batchStartIndex;

    // The index of the last message leaf in the batch to process, inclusive.
    // This value may be less than batchStartIndex + batchSize if this batch is
    // the last batch and the total number of mesages is not a multiple of the
    // batch size.
    signal input batchEndIndex;
    component msgBatchLeavesExists = QuinBatchLeavesExists(msgTreeDepth, msgSubTreeDepth);
    msgBatchLeavesExists.root <== msgRoot;

    component messageHashers[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        messageHashers[i] = MessageHasher();
        for (var j = 0; j < MSG_LENGTH; j ++) {
            messageHashers[i].in[j] <== msgs[i][j];
        }
        msgBatchLeavesExists.leaves[i] <== messageHashers[i].hash;
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
        msgBatchLeavesExists.path_index[i] <== msgBatchPathIndices.out[i];
    }

    /**************************************************************************
        2. Derive ECDH shared keys and decrypt each message.
    */

    // Derive the ECDH shared key from the coordinator's private key and the
    // message's ephemeral public key. Also ensure that the coordinator's
    // public key from the contract is correct based on the given private key -
    // that is, the prover knows the coordinator's private key.

    /*// The coordinator's public key*/
    signal private input coordPrivKey;

    // The cooordinator's public key from the contract.
    signal input coordPubKey[2];

    // The ECDH public key per message
    signal input encPubKeys[batchSize][2];

    component derivedPubKey = PrivToPubKey();
    derivedPubKey.privKey <== coordPrivKey;

    // These checks ensure that the prover knows the correct coordinator's
    // private key
    derivedPubKey.pubKey[0] === coordPubKey[0];
    derivedPubKey.pubKey[1] === coordPubKey[1];

    // Derive each shared key and decrypt each message
    component ecdh[batchSize];
    component decryptors[batchSize];

    for (var i = 0; i < batchSize; i++) {
        ecdh[i] = Ecdh();
        ecdh[i].privKey <== coordPrivKey;
        ecdh[i].pubKey[0] <== encPubKeys[i][0];
        ecdh[i].pubKey[1] <== encPubKeys[i][1];

        decryptors[i] = Decrypt(MSG_LENGTH - 1);
        decryptors[i].privKey <== ecdh[i].sharedKey;
        for (var j = 0; j < MSG_LENGTH; j++) {
            decryptors[i].message[j] <== msgs[i][j];
        }
    }
}
