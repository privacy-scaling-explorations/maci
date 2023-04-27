jest.setTimeout(90000)
import {
    Keypair,
} from 'maci-domainobjs'

import { 
    stringifyBigInts, 
    genRandomSalt,
    IncrementalQuinTree,
    hash4,
    hash5,
} from 'maci-crypto'

import { 
    genWitness,
    getSignalByName,
} from './utils'

describe('Key deactivation circuit', () => {
    const circuit = 'isDeactivatedKey_test'

    const NUM_LEVELS = 3;
    const ZERO_VALUE = 0;

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

        // The isDeactivated flag should be 0 for the actice key
        const witness = await genWitness(circuit, circuitInputs)
        const isDeactivated = (await getSignalByName(circuit, witness, 'main.isDeactivated')) == 1
        expect(isDeactivated).toBeFalsy();
    })
})
