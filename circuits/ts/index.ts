import * as fs from 'fs'
import * as path from 'path'
const circom = require('circom')
const snarkjs = require('snarkjs')
import * as shell from 'shelljs'

import {
    SnarkProvingKey,
    SnarkVerifyingKey,
    parseVerifyingKeyJson,
} from 'libsemaphore'

import {
    stringifyBigInts,
} from 'maci-crypto'


/*
 * @param circuitPath The subpath to the circuit file (e.g.
 *     test/batchProcessMessage_test.circom)
 */
const compileAndLoadCircuit = async (
    circuitPath: string
) => {
    return await circom.tester(path.join(
        __dirname,
        'circuits',
        `../../circom/${circuitPath}`,
    ))
}

const executeCircuit = async (
    circuit: any,
    inputs: any,
) => {

    const witness = await circuit.calculateWitness(inputs, true)
    await circuit.checkConstraints(witness)
    await circuit.loadSymbols()

    return witness
}

const getSignalByName = (
    circuit: any,
    witness: any,
    signal: string,
) => {

    return witness[circuit.symbols[signal].varIdx]
}

const loadPk = (binName: string): SnarkProvingKey => {
    const p = path.join(__dirname, '../build/' + binName + '.bin')
    return fs.readFileSync(p)
}

const loadVk = (jsonName: string): SnarkVerifyingKey => {
    const p = path.join(__dirname, '../build/' + jsonName + '.json')
    return parseVerifyingKeyJson(fs.readFileSync(p).toString())
}

const genBatchUstProofAndPublicSignals = (witness: any) => {
    return genProofAndPublicSignals(
        witness,
        'batchUstCircuit.r1cs',
        'batchUst.zkey',
    )
}

const genQvtProofAndPublicSignals = (witness: any) => {
    return genProofAndPublicSignals(
        witness,
        'qvtCircuit.r1cs',
        'qvt.zkey',
    )
}

const genProofAndPublicSignals = (
    witness: any,
    circuitFilename: string,
    zkeyFilename: string,
) => {
    const zkeyPath = path.join(__dirname, '../build/', zkeyFilename)
    const witnessPath = path.join(__dirname, '../build/' + Date.now() + '.witness.json')

    fs.writeFileSync(witnessPath, JSON.stringify(stringifyBigInts(witness)))

    const { proof, publicSignals } = snarkjs.groth16.prove(
        zkeyPath,
        witnessPath,
    )

    shell.rm('-f', witnessPath)

    return { proof, publicSignals }
}

const verifyProof = (
    vkFilename: string,
    publicSignals: any,
    proof: any,
): boolean => {
    const vkFilepath = path.join(__dirname, '../build/', vkFilename)
    const vk = JSON.parse(fs.readFileSync(vkFilepath).toString())

    return snarkjs.groth16.verify(vk, publicSignals, proof)
}

const verifyBatchUstProof = (
    publicSignals: any,
    proof: any,
) => {

    return verifyProof('batchUstVk.json', publicSignals, proof)
}

const verifyQvtProof = (
    publicSignals: any,
    proof: any,
) => {

    return verifyProof('qvtVk.json', publicSignals, proof)
}


export {
    compileAndLoadCircuit,
    executeCircuit,
    getSignalByName,
    loadPk,
    loadVk,
    genBatchUstProofAndPublicSignals,
    genQvtProofAndPublicSignals,
    verifyBatchUstProof,
    verifyQvtProof,
}
