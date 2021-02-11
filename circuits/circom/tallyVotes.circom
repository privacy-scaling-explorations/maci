include "../node_modules/circomlib/circuits/comparators.circom";
include "./trees/incrementalQuinTree.circom";
include "./trees/calculateTotal.circom";
include "./trees/checkRoot.circom";
include "./hasherSha256.circom";
include "./hasherPoseidon.circom";
include "./unpackElement.circom";

/*
 * Tally votes in the ballots, batch by batch.
 */
template TallyVotes(
    stateTreeDepth,
    intStateTreeDepth,
    voteOptionTreeDepth
) {
    assert(voteOptionTreeDepth > 0);
    assert(intStateTreeDepth > 0);
    assert(intStateTreeDepth < stateTreeDepth);

    var TREE_ARITY = 5;

    // The number of ballots in this batch
    var batchSize = TREE_ARITY ** intStateTreeDepth;
    var numVoteOptions = TREE_ARITY ** voteOptionTreeDepth;

    var BALLOT_LENGTH = 2;
    var BALLOT_NONCE_IDX = 0;
    var BALLOT_VO_ROOT_IDX = 1;

    signal private input stateRoot;
    signal private input ballotRoot;
    signal private input sbSalt;

    // The only public input (inputHash) is the hash of the following:
    signal private input sbCommitment;
    signal private input newResultsCommitment;

    signal private input packedVals;
    signal input inputHash;

    var k = stateTreeDepth - intStateTreeDepth;
    // The ballots
    signal private input ballots[batchSize][BALLOT_LENGTH];
    signal private input ballotPathElements[k][TREE_ARITY - 1];
    /*signal private input voteLeaves[batchSize][numVoteOptions];*/

    //  ----------------------------------------------------------------------- 
    // Verify inputHash
    component inputHasher = TallyVotesInputHasher();
    inputHasher.sbCommitment <== sbCommitment;
    inputHasher.newResultsCommitment <== newResultsCommitment;
    inputHasher.packedVals <== packedVals;
    /*inputHasher.hash === inputHash;*/

    signal numSignUps;
    signal batchStartIndex;

    numSignUps <== inputHasher.numSignUps;
    batchStartIndex <== inputHasher.batchStartIndex;

    //  ----------------------------------------------------------------------- 
    // Verify the ballots

    // Hash each ballot and generate the subroot of the ballots
    component ballotSubroot = QuinCheckRoot(intStateTreeDepth);
    component ballotHashers[batchSize];
    for (var i = 0; i < batchSize; i ++) {
        ballotHashers[i] = HashLeftRight();
        ballotHashers[i].left <== ballots[i][BALLOT_NONCE_IDX];
        ballotHashers[i].right <== ballots[i][BALLOT_VO_ROOT_IDX];

        ballotSubroot.leaves[i] <== ballotHashers[i].hash;
    }

    component ballotQle = QuinLeafExists(k);
    component ballotPathIndices = QuinGeneratePathIndices(k);
    ballotPathIndices.in <== batchStartIndex;
    ballotQle.leaf <== ballotSubroot.root;
    ballotQle.root <== ballotRoot;
    for (var i = 0; i < k; i ++) {
        ballotQle.path_index[i] <== ballotPathIndices.out[i];
        for (var j = 0; j < TREE_ARITY - 1; j ++) {
            ballotQle.path_elements[i][j] <== ballotPathElements[i][j];
        }
    }

    // Verify the vote option roots

    // Tally the new results
    
    // Tally the new total spent voice credit tally

    // Tally the total votes per vote option

    // Tally the total votes

    // Commit to the results


    /*//  ----------------------------------------------------------------------- */
    /*// Verify sbCommitment*/
    /*component sbCommitmentHasher = Hasher3();*/
    /*sbCommitmentHasher.in[0] <== stateRoot;*/
    /*sbCommitmentHasher.in[1] <== ballotRoot;*/
    /*sbCommitmentHasher.in[2] <== sbSalt;*/
    /*sbCommitmentHasher.hash === sbCommitment;*/

    /*//  ----------------------------------------------------------------------- */
    /*// Validate batchStartIndex and numSignUps*/
    /*// batchStartIndex should be less than numSignUps*/
    /*component validNumSignups = LessThan(50);*/
    /*validNumSignups.in[0] <== batchStartIndex;*/
    /*validNumSignups.in[1] <== numSignUps;*/
    /*validNumSignups.out === 1;*/

    /*//  ----------------------------------------------------------------------- */
    /*// Validate ballots*/
    /*// TODO*/
}

template TallyVotesInputHasher() {
    signal input sbCommitment;
    signal input newResultsCommitment;
    signal output numSignUps;
    signal output batchStartIndex;
    signal output hash;

    signal input packedVals;
    component unpack = UnpackElement(2);
    unpack.in <== packedVals;
    numSignUps <== unpack.out[0];
    batchStartIndex <== unpack.out[1];

    /*component hasher = Sha256Hasher3();*/
    /*hasher.in[0] <== packedVals;*/
    /*hasher.in[1] <== sbCommitment;*/
    /*hasher.in[2] <== newResultsCommitment;*/

    /*hash <== hasher.hash;*/
}
