import * as fs from 'fs'
import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import {
    SnarkProvingKey,
    SnarkVerifyingKey,
    parseVerifyingKeyJson,
} from 'libsemaphore'

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

/*
 * @param circuitPath The subpath to the circuit file (e.g.
 *     test/batchProcessMessage_test.circom)
 */
const compileAndLoadCircuit = async (
    circuitPath: string
) => {
    const circuitDef = await compiler(path.join(
        __dirname,
        'circuits',
        `../../circom/${circuitPath}`,
    ))
    return new Circuit(circuitDef)
}

const loadPk = (binName: string): SnarkProvingKey => {
    const p = path.join(__dirname, '../build/' + binName + '.bin')
    return fs.readFileSync(p)
}

const loadVk = (jsonName: string): SnarkVerifyingKey => {
    const p = path.join(__dirname, '../build/' + jsonName + '.json')
    return parseVerifyingKeyJson(fs.readFileSync(p).toString())
}

export {
    compileAndLoadCircuit,
    loadPk,
    loadVk,
}
