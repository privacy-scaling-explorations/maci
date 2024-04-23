pragma circom 2.0.0;

// zk-kit imports
include "./safe-comparators.circom";
// local imports
include "./hashers.circom";

/**
 * Generates a sha256 hash of the provided tally inputs.
 */
template TallyVotesInputHasher() {
    // Commitment to the state and ballots.
    signal input sbCommitment;
    // Commitment to the current tally before this batch.
    signal input currentTallyCommitment;
    // Commitment to the new tally after processing this batch.
    signal input newTallyCommitment;
    // Packed values.
    signal input packedVals;

    signal output numSignUps;
    signal output batchNum;
    signal output hash;

    // Unpack the elements.
    var computedUnpackedElement[2] = UnpackElement(2)(packedVals);
    batchNum <== computedUnpackedElement[1];
    numSignUps <== computedUnpackedElement[0];

    hash <== Sha256Hasher(4)([
        packedVals,
        sbCommitment,
        currentTallyCommitment,
        newTallyCommitment
    ]);
}