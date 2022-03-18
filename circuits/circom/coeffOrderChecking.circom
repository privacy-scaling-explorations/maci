pragma circom 2.0.0;
include "./node_modules/circomlib/circuits/mux1.circom";
include "./node_modules/circomlib/circuits/comparators.circom";
include "./trees/checkRoot.circom";
include "./trees/calculateTotal.circom";
include "./hasherPoseidon.circom";
include "./coeff.circom";

// out = 0 if valid; out = 1 if invalid
// flag = 0 will skip the equality check
template IsValidCoeff() {
    signal input flag;
    signal input in[2];
    signal output out;
    component isz = IsZero();
    component ise = IsEqual();
    component mux = Mux1();
    isz.in <== flag;
    ise.in[0] <== in[0];
    ise.in[1] <== in[1];

    mux.s <== 1 - isz.out;
    mux.c[0] <== 0;
    mux.c[1] <== 1 - ise.out;
    out <== mux.out;
}

// check the coeffcient ballot trees are correct ordering from ballot tree
template CoeffOrderChecking(stateTreeArity, stateTreeDepth, coeffTreeArity, coeffTreeDepth) {
    var N = stateTreeArity ** stateTreeDepth;
    var M = coeffTreeArity ** coeffTreeDepth;

    signal input ballotTreeRoot;
    signal input ballotTreeRoot1;
    signal input ballotTreeRoot2;
    signal input ballotHashs[N];
    signal input ballotHashs1[M];
    signal input ballotHashs2[M];
    signal input emptyBallotHash;


    signal input stateRoot;
    signal input coeffTreeRoot;
    signal input sbSalt;
    signal input coeffSalt;

    // The public input (inputHash) is the hash of the following:
    signal input sbCommitment;
    signal input coeffCommitment;
    signal input packedVals;
    signal input inputHash; // public

    signal output out;

    //  ----------------------------------------------------------------------- 
    // check the order is correct
    component total = CalculateTotal(N*(N-1)/2);
    component isValidLeft[N*(N-1)/2];
    component isValidRight[N*(N-1)/2];
    component isValidOrder = IsZero();
    var cnt = 0;
    for (var j = 1; j < N; j++){
        for (var i = 0; i < j; i++){
            if (cnt < M) {
                var index = j*(j-1)/2 + i;
                isValidLeft[cnt] = IsValidCoeff();
                isValidRight[cnt] = IsValidCoeff();
    
                isValidLeft[cnt].flag <== ballotHashs1[index] - emptyBallotHash;
                isValidLeft[cnt].in[0] <== ballots[i];
                isValidLeft[cnt].in[1] <== ballotHashs1[index];
    
                isValidRight[cnt].flag <== ballotHashs2[index] - emptyBallotHash;
                isValidRight[cnt].in[0] <== ballots[j];
                isValidRight[cnt].in[1] <== ballotHashs2[index];
    
                total.nums[cnt] <== isValidLeft[cnt].out + isValidRight[cnt].out;
            } else {
                total.nums[cnt] <== 0;
            }
            cnt++;
        }
    }
    isValidOrder.in <== total.sum;
    isValidOrder.out === 1;

    //  ----------------------------------------------------------------------- 
    // check the root matches
    var TREE_ARITY = 5;
    component ballotTree = QuichCheckRoot(stateTreeDepth);
    for (var i = 0; i < TREE_ARITY ** stateTreeDepth; j ++) {
        ballotTree.leaves[j] <== ballotHashs[i];
    }
    ballotTree.root === ballotTreeRoot;

    component ballotTree1 = QuichCheckRoot(coeffTreeDepth);
    for (var i = 0; i < TREE_ARITY ** coeffTreeDepth; j ++) {
        ballotTree1.leaves[j] <== ballotHashs1[i];
    }
    ballotTree1.root === ballotTreeRoot1;

    component ballotTree2 = QuichCheckRoot(coeffTreeDepth);
    for (var i = 0; i < TREE_ARITY ** coeffTreeDepth; j ++) {
        ballotTree2.leaves[j] <== ballotHashs2[i];
    }
    ballotTree2.root === ballotTreeRoot2;

    //  ----------------------------------------------------------------------- 
    // Verify sbCommitment
    component sbCommitmentHasher = Hasher3();
    sbCommitmentHasher.in[0] <== stateRoot;
    sbCommitmentHasher.in[1] <== ballotTreeRoot;
    sbCommitmentHasher.in[2] <== sbSalt;
    sbCommitmentHasher.hash === sbCommitment;
    
    //  ----------------------------------------------------------------------- 
    // Verify coeffCommitment
    component coeffCommitmentHasher = Hasher4();
    coeffCommitmentHasher.in[0] <== ballotTreeRoot1;
    coeffCommitmentHasher.in[1] <== ballotTreeRoot2;
    coeffCommitmentHasher.in[2] <== coeffTreeRoot;
    coeffCommitmentHasher.in[3] <== coeffSalt;
    coeffCommitmentHasher.hash === coeffCommitment;


    //  ----------------------------------------------------------------------- 
    // Verify inputHash
    component inputHasher = CoefficientInputHasher();
    inputHasher.sbCommitment <== sbCommitment;
    inputHasher.coeffCommitment <== coeffCommitment;
    inputHasher.packedVals <== packedVals;
    inputHasher.hash === inputHash;

}

