jest.setTimeout(90000)
import {
    Keypair,
} from 'maci-domainobjs'

import {
    stringifyBigInts,
    IncrementalQuinTree,
    hash3,
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
        const pseudoCiphertext1 = new Keypair();
        const pseudoCiphertext2 = new Keypair();
        const c1 = pseudoCiphertext1.pubKey.rawPubKey;
        const c2 = pseudoCiphertext2.pubKey.rawPubKey;
        const salt = pseudoCiphertext2.privKey.rawPrivKey;

        const keyHash = hash3([...keypair.pubKey.rawPubKey, salt]);

        // Create key leaf as hash of the x and y key components
        const keyLeaf = hash5(
        [
            keyHash,
            ...c1,
            ...c2,
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
            salt,
        })

        const witness = await genWitness(circuit, circuitInputs)
        const isDeactivated = (await getSignalByName(circuit, witness, 'main.isDeactivated')) == 1
        expect(isDeactivated).toBeTruthy()
    })

    it('Active key should not be found in the tree', async () => {
        const deactivatedKeysTree = new IncrementalQuinTree(NUM_LEVELS, ZERO_VALUE, 5, hash5)
        const keypair = new Keypair();

        // Generate random cyphertext as a point on the curve
        const pseudoCiphertext1 = new Keypair();
        const pseudoCiphertext2 = new Keypair();
        const c1 = pseudoCiphertext1.pubKey.rawPubKey;
        const c2 = pseudoCiphertext2.pubKey.rawPubKey;
        const salt = pseudoCiphertext2.privKey.rawPrivKey;

        const keyHash = hash3([...keypair.pubKey.rawPubKey, salt]);

        // Create key leaf as hash of the x and y key components
        const keyLeaf = hash5(
        [
            keyHash,
            ...c1,
            ...c2,
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
            salt,
        })

        // The isDeactivated flag should be 0 for the active key
        const witness = await genWitness(circuit, circuitInputs)
        const isDeactivated = (await getSignalByName(circuit, witness, 'main.isDeactivated')) == 1
        expect(isDeactivated).toBeFalsy();
    })

    it('Multiple keys can be deactivated and verified', async () => {
        const deactivatedKeysTree = new IncrementalQuinTree(NUM_LEVELS, ZERO_VALUE, 5, hash5)
        const keypair1 = new Keypair();
        const keypair2 = new Keypair();
        const keypair3 = new Keypair();

        // Generate random cyphertext as a point on the curve
        const pseudoCiphertext11 = new Keypair();
        const pseudoCiphertext12 = new Keypair();
        const c11 = pseudoCiphertext11.pubKey.rawPubKey;
        const c12 = pseudoCiphertext12.pubKey.rawPubKey;
        const salt1 = pseudoCiphertext12.privKey.rawPrivKey;

        const keyHash1 = hash3([...keypair1.pubKey.rawPubKey, salt1]);

        // Create key leaf as hash of the x and y key components
        const keyLeaf1 = hash5(
        [
            keyHash1,
            ...c11,
            ...c12,
        ]);

      
        deactivatedKeysTree.insert(keyLeaf1);

        // Generate random cyphertext as a point on the curve
        const pseudoCiphertext21 = new Keypair();
        const pseudoCiphertext22 = new Keypair();
        const c21 = pseudoCiphertext21.pubKey.rawPubKey;
        const c22 = pseudoCiphertext22.pubKey.rawPubKey;
        const salt2 = pseudoCiphertext22.privKey.rawPrivKey;

        const keyHash2 = hash3([...keypair2.pubKey.rawPubKey, salt2]);

        // Create key leaf as hash of the x and y key components
        const keyLeaf2 = hash5(
        [
            keyHash2,
            ...c21,
            ...c22,
        ]);

        deactivatedKeysTree.insert(keyLeaf2);

         // Generate random cyphertext as a point on the curve
         const pseudoCiphertext31 = new Keypair();
         const pseudoCiphertext32 = new Keypair();
         const c31 = pseudoCiphertext31.pubKey.rawPubKey;
         const c32 = pseudoCiphertext32.pubKey.rawPubKey;
         const salt3 = pseudoCiphertext32.privKey.rawPrivKey;
 
         const keyHash3 = hash3([...keypair3.pubKey.rawPubKey, salt3]);
 
         // Create key leaf as hash of the x and y key components
         const keyLeaf3 = hash5(
         [
             keyHash3,
             ...c31,
             ...c32,
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
            salt: salt1
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
            salt: salt2
        });
        const witness2 = await genWitness(circuit, circuitInputs2);
        const isDeactivated2 = (await getSignalByName(circuit, witness2, 'main.isDeactivated')) == 1;
        expect(isDeactivated2).toBeTruthy();

        const circuitInputs3 = stringifyBigInts({
            root: deactivatedKeysTree.root,
            key: keypair3.pubKey.asCircuitInputs(),
            path_elements: inclusionProofActiveKey.pathElements,
            path_index: inclusionProofActiveKey.indices,
            c1: c31,
            c2: c32,
            salt: salt3
        });
        const witness3 = await genWitness(circuit, circuitInputs3);
        const isDeactivated3 = (await getSignalByName(circuit, witness3, 'main.isDeactivated')) == 1;
        expect(isDeactivated3).toBeFalsy();
    });

    it('Invalid path index should throw an error', async () => {
        const deactivatedKeysTree = new IncrementalQuinTree(NUM_LEVELS, ZERO_VALUE, 5, hash5);
        const keypair = new Keypair();

        // Generate random cyphertext as a point on the curve
        const pseudoCiphertext1 = new Keypair();
        const pseudoCiphertext2 = new Keypair();
        const c1 = pseudoCiphertext1.pubKey.rawPubKey;
        const c2 = pseudoCiphertext2.pubKey.rawPubKey;
        const salt = pseudoCiphertext2.privKey.rawPrivKey;

        const keyHash = hash3([...keypair.pubKey.rawPubKey, salt]);

        // Create key leaf as hash of the x and y key components
        const keyLeaf = hash5(
        [
            keyHash,
            ...c1,
            ...c2,
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
            salt,
        });

        await expect(genWitness(circuit, circuitInputs)).rejects.toThrow();
    });
})
