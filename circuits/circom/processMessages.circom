include "./ecdh.circom"
include "./privToPubKey.circom"

template ProcessMessages(
    stateTreeDepth,
    msgTreeDepth,
    voteOptionTreeDepth,
    batchSize
) {
    var TREE_ARITY = 5;

    // stateTreeDepth: the depth of the state tree
    // msgTreeDepth: the depth of the message tree
    // voteOptionTreeDepth: depth of the vote option tree
    // batchSize: the number of messages to process
    
    // CONSIDER: sha256 hash any values from the contract, pass in the hash
    // as a public input, and pass in said values as private inputs. This saves
    // a lot of gas for the verifier at the cost of constraints for the prover.

    // The existing state root
    signal input currentStateRoot;

    // The existing message root
    signal public input msgRoot;

    // The new state tree root
    signal output newStateRoot;

    /**************************************************************************
        1. Check whether each message exists in the message tree. Throw if
        otherwise.

        To save constraints, compute the subroot of the messages and check
        whether the subroot is a member of the message tree. This means that
        batchSize must be the message tree arity raised to some power (e.g. 5 ^
        2)
    */
    var MSG_LENGTH = 8; // iv and data

    signal private input msgs[batchSize][MSG_LENGTH];
    signal input msgSubrootPath[msgTreeDepth][TREE_ARITY];

    // The index of the first message leaf in the batch. Note that messages are
    // processed in reverse order.
    signal input batchStartIndex;

    // The index of the last message leaf in the batch to process. This value
    // may be less than batchStartIndex + batchSize if this batch is the last
    // batch and the total number of mesages is not a multiple of the batch
    // size.
    signal input batchEndIndex;

    /**************************************************************************
        2. Derive ECDH shared keys and decrypt each message.
    */

    // Derive the ECDH shared key from the coordinator's private key and the
    // message's ephemeral public key. Also ensure that the coordinator's
    // public key from the contract is correct based on the given private key -
    // that is, the prover knows the coordinator's private key.

    // The coordinator's public key
    signal private input coordPrivKey;

    // The cooordinator's public key from the contract.
    signal private input coordPubKey[2];

    // The ECDH public key per message
    signal public input encPubKeys[batchSize];

    component derivedPubKey = PublicKey();
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
        decryptors[i].privKey <== ecdh.sharedKey[i];
        for (var j = 0; j < MESSAGE_LENGTH; j++) {
            decryptors[i].message[j] <== msgs[i][j];
        }
    }
}
