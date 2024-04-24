pragma circom 2.0.0;

// zk-kit imports
include "./unpack-element.circom";
// local imports
include "hashers.circom";

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
    // The current state and ballot root commitment (hash(stateRoot, ballotRoot, salt)).
    signal input currentSbCommitment;
    signal input newSbCommitment;
    signal input pollEndTimestamp;

    signal output maxVoteOptions;
    signal output numSignUps;
    signal output batchStartIndex;
    signal output batchEndIndex;
    signal output hash;
    
    // 1. Unpack packedVals and ensure that it is valid.
    var computedUnpackElement[UNPACK_ELEM_LENGTH] = UnpackElement(UNPACK_ELEM_LENGTH)(packedVals);

    maxVoteOptions <== computedUnpackElement[3];
    numSignUps <== computedUnpackElement[2];
    batchStartIndex <== computedUnpackElement[1];
    batchEndIndex <== computedUnpackElement[0];

    // 2. Hash coordPubKey.
    var computedPubKey = PoseidonHasher(2)(coordPubKey);

    // 3. Hash the 6 inputs with SHA256.
    hash <== Sha256Hasher(6)([
        packedVals,
        computedPubKey,
        msgRoot,
        currentSbCommitment,
        newSbCommitment,
        pollEndTimestamp
    ]);
}