

include "./elGamalEncryption.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/escalarmulany.circom";


include "./trees/incrementalQuinTree.circom";
include './poseidon/poseidonHashT3.circom';
import './messageToCommand.circom';
import './messageHasher.circom';
import './unpackElement.circom';
import './isDeactivatedKey.circom';
import './ecdh.circom';

template ProcessDeactivationMessages(msgQueueSize, stateTreeDepth) {
    var MSG_LENGTH = 11;
    var TREE_ARITY = 5;
    var msgTreeZeroValue = 8370432830353022751713833565135785980866757267633941821328460903436894336785;

    signal input coordPrivKey;
    signal input coordPubKey;
    signal input encPubKeys[msgQueueSize][2];
    signal input msgs[msgQueueSize][MSG_LENGTH];
    signal input deactivatedTreePathElements[msgQueueSize][stateTreeDepth][TREE_ARITY - 1];
    signal input stateLeafPathElements[msgQueueSize][stateTreeDepth][TREE_ARITY - 1];
    signal input currentStateLeaves[msgQueueSize][STATE_LEAF_LENGTH];
    signal input elGamalEnc[msgQueueSize][2][2];
    signal input deactivatedTreeRoot;
    signal input currentStateRoot;
    signal input numMsgs;

    // Incremental array of root hashes
    signal messageHashes[msgQueueSize + 1];    
    messageHashes[0] <== msgTreeZeroValue;

    signal output newMessageRoot;
    signal output newDeactivatedTreeRoot;

    // Process each message
    component processor[msgQueueSize];
    for (var i = 0; i < msgQueueSize; i++) {
        processor[i] = ProcessSingleDeactivationMessage(stateTreeDepth, TREE_ARITY);
        processor[i].prevHash <== messageHashes[i];
        processor[i].msg <== msgs[i];
        processor[i].coordPrivKey <== coordPrivKey;
        processor[i].coordPubKey <== coordPubKey;
        processor[i].encPubKey[0] <== encPubKeys[i][0];
        processor[i].encPubKey[1] <== encPubKeys[i][1];
        processor[i].currentStateRoot <== currentStateRoot;

        // Copy deactivated tree path elements and state tree path elements
        for (var j = 0; j < stateTreeDepth; j++) {
            for (var k = 0; k < TREE_ARITY; k++) {
                processor[i].deactivatedTreePathElements[j][k] <== deactivatedTreePathElements[i][j][k];
                processor[i].stateLeafPathElements[j][k] <== stateLeafPathElements[i][j][k];
            }
        }

        // Copy state leaves
        for (var j = 0; j < STATE_LEAF_LENGTH; j++) {
            processor[i].currentStateLeaf[j] <== currentStateLeaves[i][j];
        }

        // Copy c1 and c2 enc values
        processor[i].c1[0] <== elGamalEnc[i][0][0];
        processor[i].c1[1] <== elGamalEnc[i][0][1];

        processor[i].c2[0] <== elGamalEnc[i][1][0];
        processor[i].c2[1] <== elGamalEnc[i][1][1];

        messageHashes[i + 1] <== processor.newHash;
    }

    // Output final hash
    newMessageRoot <== messageHashes[msgQueueSize];
}

template ProcessSingleDeactivationMessage(stateTreeDepth, treeArity) {
    var MSG_LENGTH = 11;
    var STATE_LEAF_LENGTH = 4;

    // Decrypt message into a command
    signal input prevHash;
    signal input msg;
    signal input coordPrivKey;
    signal input coordPubKey;
    signal input encPubKey[2];
    signal input c1[2];
    signal input c2[2];
    signal input deactivatedTreePathElements[stateTreeDepth][TREE_ARITY - 1];
    signal input stateLeafPathElements[stateTreeDepth][TREE_ARITY - 1];
    signal input stateLeaf[STATE_LEAF_LENGTH];
    signal input currentStateRoot;

    signal output newHash;

    // Decode message
    // ------------------------------------
    component command = MessageToCommand();
    command.encPrivKey <== coordPrivKey;
    command.encPubKey[0] <== encPubKey[0];
    command.encPubKey[1] <== encPubKey[1];

    for (var j = 0; j < MSG_LENGTH; j ++) {
        command.message[j] <== msg[j];
    }
    // ------------------------------------
    // Verify if pubkey value is (0,0)
    component isPubKeyValid = IsEqual();
    isPubKeyValid.in[0] <== 0;
    isPubKeyValid.in[1] <== command.newPubKey[0] + command.newPubKey[1];

    // Verify if voteWeight is 0
    component isVoteWeightValid = IsEqual();
    isVoteWeightValid.in[0] <== 0;
    isVoteWeightValid.in[1] <== command.newVoteWeight;

    component isDataValid = IsEqual();
    isDataValid.in[0] <== 1;
    isDataValid.in[1] <== isPubKeyValid.out * isVoteWeightValid.out;

    // Compute ElGamal encryption
    // --------------------------
    component elGamalBit = ElGamalEncryptBit();
    elGamalBit.pk[0] <== coordPubKey[0];
    elGamalBit.pk[1] <== coordPubKey[1];

    elGamalBit.Me[0] === c1[0];
    elGamalBit.Me[1] === c1[1];

    elGamalBit.kG[0] === c2[0];
    elGamalBit.kG[1] === c2[1];
    // --------------------------
    // Compute deactivated key leaf hash
    component deactivatedLeafHasher = poseidonHashT3();
    deactivatedLeafHasher.in[0] <== stateLeaf[0];
    deactivatedLeafHasher.in[1] <== stateLeaf[1];
    deactivatedLeafHasher.in[2] <== command.salt;

    // Verify that the deactivated leaf exists in the given deactivated keys root
    // --------------------------------------------------------------------------
    component isInDeactivated = IsDeactivatedKey(stateTreeDepth);
    isInDeactivated.root <== newDeactivatedTreeRoot;
    signal input key[2];

    // Ciphertext of the encrypted key status
    signal input c1;
    signal input c2;

    signal input path_index[levels];
    signal input path_elements[levels][LEAVES_PER_PATH_LEVEL];
    isInDeactivated.

    // Verify that the state leaf exists in the given state root
    // ------------------------------------------------------------------
    component stateLeafQip = QuinTreeInclusionProof(stateTreeDepth);
    component stateLeafHasher = Hasher4();
    for (var i = 0; i < STATE_LEAF_LENGTH; i++) {
        stateLeafHasher.in[i] <== stateLeaf[i];
    }
    stateLeafQip.leaf <== stateLeafHasher.hash;
    for (var i = 0; i < stateTreeDepth; i ++) {
        for (var j = 0; j < treeArity - 1; j++) {
            stateLeafQip.path_elements[i][j] <== stateLeafPathElements[i][j];
        }
    }
    stateLeafQip.root === currentStateRoot;
    // ------------------------------------------------------------------
    // Compute new "root" hash
    // -------------------------------------------
    // Hashing message
    messageHashers = MessageHasher();
    for (var j = 0; j < MSG_LENGTH; j ++) {
        messageHashers.in[j] <== msgs[i][j];
    }
    messageHashers.encPubKey[0] <== encPubKey[0];
    messageHashers.encPubKey[1] <== encPubKey[1];
    
    // Hashing previous hash and message hash
    component newRootHash = PoseidonHashT3()
    newRootHash.in[0] <== prevHash
    newRootHash.in[1] <== messageHashers.hash

    newHash <== newRootHash.out
    // -------------------------------------------
}