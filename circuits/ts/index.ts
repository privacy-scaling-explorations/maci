import * as fs from 'fs'
import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import {
    stringifyBigInts,
    IncrementalMerkleTree,
    SnarkBigInt,
} from 'maci-crypto'

import {
    Keypair,
    PubKey,
    Message,
    StateLeaf,
} from 'maci-domainobjs'

const compileAndLoadCircuit = async (
    circuitFilename: string
) => {
    const circuitDef = await compiler(path.join(__dirname, 'circuits', `../../circom/test/${circuitFilename}`))
    return new Circuit(circuitDef)
}

const genBatchUstInputs = (
    coordinator: Keypair,
    msgs: Message[],
    ecdhPublicKeyBatch: PubKey[],
    msgTree: IncrementalMerkleTree,
    msgTreeBatchPathElements: SnarkBigInt[],
    msgTreeBatchStartIndex: SnarkBigInt,
    randomStateLeaf: StateLeaf,
    randomLeafRoot: SnarkBigInt,
    randomLeafPathElements: SnarkBigInt[],
    voteOptionTreeBatchLeafRaw: SnarkBigInt[],
    userVoteOptionsBatchRoot: SnarkBigInt[],
    userVoteOptionsBatchPathElements: SnarkBigInt[],
    userVoteOptionsBatchPathIndexes: SnarkBigInt[],
    voteOptionsMaxIndex: SnarkBigInt,
    stateTreeBatch: StateLeaf[],
    stateTreeMaxIndex: SnarkBigInt,
    stateTreeBatchRoot: SnarkBigInt[],
    stateTreeBatchPathElements: SnarkBigInt[],
    stateTreeBatchPathIndices: SnarkBigInt[],
) => {

    return stringifyBigInts({
        'coordinator_public_key': coordinator.pubKey.asCircuitInputs(),
        'message': msgs.map((x) => x.asCircuitInputs()),
        'ecdh_private_key': coordinator.privKey.asCircuitInputs(),
        'ecdh_public_key': ecdhPublicKeyBatch.map((x) => x.asCircuitInputs()),
        'msg_tree_root': msgTree.root,
        'msg_tree_path_elements': msgTreeBatchPathElements,
        'msg_tree_batch_start_index': msgTreeBatchStartIndex,
        'random_leaf': randomStateLeaf.hash(),
        'random_leaf_root': randomLeafRoot,
        'random_leaf_path_elements': randomLeafPathElements,
        'vote_options_leaf_raw': voteOptionTreeBatchLeafRaw,
        'vote_options_tree_root': userVoteOptionsBatchRoot,
        'vote_options_tree_path_elements': userVoteOptionsBatchPathElements,
        'vote_options_tree_path_index': userVoteOptionsBatchPathIndexes,
        'vote_options_max_leaf_index': voteOptionsMaxIndex,
        'state_tree_data_raw': stateTreeBatch.map((x) => x.asCircuitInputs()),
        'state_tree_max_leaf_index': stateTreeMaxIndex,
        'state_tree_root': stateTreeBatchRoot,
        'state_tree_path_elements': stateTreeBatchPathElements,
        'state_tree_path_index': stateTreeBatchPathIndices,
    })
}

export {
    compileAndLoadCircuit,
    genBatchUstInputs,
}
