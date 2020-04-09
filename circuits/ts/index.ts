import * as fs from 'fs'
import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import {
    hash,
    SnarkBigInt,
    stringifyBigInts,
    IncrementalMerkleTree,
} from 'maci-crypto'

import {
    Keypair,
    PubKey,
    Message,
    StateLeaf,
} from 'maci-domainobjs'

import {
    genNewResultsCommitment,
    genResultCommitmentVerifierCircuitInputs,
} from 'maci-core'

const compileAndLoadCircuit = async (
    circuitFilename: string
) => {
    const circuitDef = await compiler(path.join(
        __dirname,
        'circuits',
        `../../circom/test/${circuitFilename}`,
    ))
    return new Circuit(circuitDef)
}

export {
    compileAndLoadCircuit,
}
