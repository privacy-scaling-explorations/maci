jest.setTimeout(90000)
import {
    Keypair,
} from 'maci-domainobjs'

import {
    stringifyBigInts,
    IncrementalQuinTree,
    hash4,
    hash5,
} from 'maci-crypto'

import {
    genWitness,
    getSignalByName,
} from './utils'
import exp = require('constants')

describe('Key deactivation circuit', () => {
    const circuit = 'isDeactivatedKey_test'

    const NUM_LEVELS = 3;
    const ZERO_VALUE = 0;
    const MAX_LEAVES = 2**(NUM_LEVELS + 1) - 1;

    it('Deactivated key should be found in the tree', async () => {
        const deactivatedKeysTree = new IncrementalQuinTree(NUM_LEVELS, ZERO_VALUE, 5, hash5)
        const keypair = new Keypair();

        // Generate random cyphertext as a point on the curve
        const pseudoCiphertext = new Keypair();
        const [c1, c2] = pseudoCiphertext.pubKey.rawPubKey;

        // Create key leaf as hash of the x and y key components
        const keyLeaf = hash4(
        [
            ...keypair.pubKey.rawPubKey,
            ...pseudoCiphertext.pubKey.rawPubKey,
        ]);

        // Add hash to the set of deactivated keys
        deactivatedKeysTree.insert(keyLeaf);

        const inclusionProof = deactivatedKeysTree.genMerklePath(0);

        const isVerified = IncrementalQuinTree.verifyMerklePath(
            inclusionProof,
            deactivatedKeysTree.hashFunc,
        )

        expect(isVerified).toBeTruthy()

        const circuitInputs = stringifyBigInts({
            root: deactivatedKeysTree.root,
            key: keypair.pubKey.asCircuitInputs(),
            path_elements: inclusionProof.pathElements,
            path_index: inclusionProof.indices,
            c1,
            c2,
        })

        const witness = await genWitness(circuit, circuitInputs)
        const isDeactivated = (await getSignalByName(circuit, witness, 'main.isDeactivated')) == 1
        expect(isDeactivated).toBeTruthy()
    })

    it('Active key should not be found in the tree', async () => {
        const deactivatedKeysTree = new IncrementalQuinTree(NUM_LEVELS, ZERO_VALUE, 5, hash5)
        const keypair = new Keypair();

        // Random ciphertext
        const pseudoCiphertext = new Keypair();
        const [c1, c2] = pseudoCiphertext.pubKey.rawPubKey;

        const keyLeaf = hash4(
            [
                ...keypair.pubKey.rawPubKey,
                ...pseudoCiphertext.pubKey.rawPubKey,
            ]);

        deactivatedKeysTree.insert(keyLeaf);
        const newTreeRoot = deactivatedKeysTree.root;

        const inclusionProof = deactivatedKeysTree.genMerklePath(0);

        // Try to verify inclusion of the not-deactivated key in the set of deactivated keys
        const activeKeypair = new Keypair();
        const circuitInputs = stringifyBigInts({
            root: newTreeRoot,
            key: activeKeypair.pubKey.asCircuitInputs(),
            path_elements: inclusionProof.pathElements,
            path_index: inclusionProof.indices,
            c1,
            c2,
        })

        // The isDeactivated flag should be 0 for the active key
        const witness = await genWitness(circuit, circuitInputs)
        const isDeactivated = (await getSignalByName(circuit, witness, 'main.isDeactivated')) == 1
        expect(isDeactivated).toBeFalsy();
    })

    it('Multiple keys can be deactivated and verified', async () => {
        const deactivatedKeysTree = new IncrementalQuinTree(NUM_LEVELS, ZERO_VALUE, 5, hash5)

        // Generate deactivated keypair and store in tree
        const keypair1 = new Keypair();
        const pseudoCiphertext1 = new Keypair();
        const [c11, c12] = pseudoCiphertext1.pubKey.rawPubKey;
        const keyLeaf1 = hash4([
            ...keypair1.pubKey.rawPubKey,
            ...pseudoCiphertext1.pubKey.rawPubKey,
        ]);
        deactivatedKeysTree.insert(keyLeaf1);

        // Generate another deactivated keypair and store in tree
        const keypair2 = new Keypair();
        const pseudoCiphertext2 = new Keypair();
        const [c21, c22] = pseudoCiphertext2.pubKey.rawPubKey;
        const keyLeaf2 = hash4([
            ...keypair2.pubKey.rawPubKey,
            ...pseudoCiphertext2.pubKey.rawPubKey,
        ]);
        deactivatedKeysTree.insert(keyLeaf2);

        // Generate an active keypair and create inclusion proof
        const activeKeypair = new Keypair();
        const pseudoCiphertext3 = new Keypair();
        const [c31, c32] = pseudoCiphertext3.pubKey.rawPubKey;
        const keyLeaf3 = hash4([
            ...activeKeypair.pubKey.rawPubKey,
            ...pseudoCiphertext3.pubKey.rawPubKey,
        ]);

        const inclusionProofDeactivatedKey1 = deactivatedKeysTree.genMerklePath(0);
        const inclusionProofDeactivatedKey2 = deactivatedKeysTree.genMerklePath(1);
        const inclusionProofActiveKey = deactivatedKeysTree.genMerklePath(2);

        const circuitInputs1 = stringifyBigInts({
            root: deactivatedKeysTree.root,
            key: keypair1.pubKey.asCircuitInputs(),
            path_elements: inclusionProofDeactivatedKey1.pathElements,
            path_index: inclusionProofDeactivatedKey1.indices,
            c1: c11,
            c2: c12,
        });
        const witness1 = await genWitness(circuit, circuitInputs1);
        const isDeactivated1 = (await getSignalByName(circuit, witness1, 'main.isDeactivated')) == 1;
        expect(isDeactivated1).toBeTruthy();

        // Verify that the circuit correctly identifies the active and deactivated keys
        const circuitInputs2 = stringifyBigInts({
            root: deactivatedKeysTree.root,
            key: keypair2.pubKey.asCircuitInputs(),
            path_elements: inclusionProofDeactivatedKey2.pathElements,
            path_index: inclusionProofDeactivatedKey2.indices,
            c1: c21,
            c2: c22,
        });
        const witness2 = await genWitness(circuit, circuitInputs2);
        const isDeactivated2 = (await getSignalByName(circuit, witness2, 'main.isDeactivated')) == 1;
        expect(isDeactivated2).toBeTruthy();

        const circuitInputs3 = stringifyBigInts({
            root: deactivatedKeysTree.root,
            key: activeKeypair.pubKey.asCircuitInputs(),
            path_elements: inclusionProofActiveKey.pathElements,
            path_index: inclusionProofActiveKey.indices,
            c1: c31,
            c2: c32,
        });
        const witness3 = await genWitness(circuit, circuitInputs3);
        const isDeactivated3 = (await getSignalByName(circuit, witness3, 'main.isDeactivated')) == 1;
        expect(isDeactivated3).toBeFalsy();
    });

    it('Invalid path index should throw an error', async () => {
        const deactivatedKeysTree = new IncrementalQuinTree(NUM_LEVELS, ZERO_VALUE, 5, hash5);
        const keypair = new Keypair();
        const pseudoCiphertext = new Keypair();
        const [c1, c2] = pseudoCiphertext.pubKey.rawPubKey;
        const keyLeaf = hash4([
            ...keypair.pubKey.rawPubKey,
            ...pseudoCiphertext.pubKey.rawPubKey,
        ]);
        deactivatedKeysTree.insert(keyLeaf);

        // Set invalid path index to trigger an error
        const inclusionProof = deactivatedKeysTree.genMerklePath(0);
        inclusionProof.indices[NUM_LEVELS - 1] = MAX_LEAVES;

        // Verify that the circuit correctly handles an invalid path index by returning false
        const circuitInputs = stringifyBigInts({
            root: deactivatedKeysTree.root,
            key: keypair.pubKey.asCircuitInputs(),
            path_elements: inclusionProof.pathElements,
            path_index: inclusionProof.indices,
            c1: c1,
            c2: c2,
        });

        await expect(genWitness(circuit, circuitInputs)).rejects.toThrow();
    });
})
