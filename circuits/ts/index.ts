import * as fs from 'fs'
import * as path from 'path'
const circom = require('circom')
import * as shell from 'shelljs'

import {
    stringifyBigInts,
    unstringifyBigInts,
} from 'maci-crypto'

import { config } from 'maci-config'
const zkutilPath = config.zkutil_bin

/*
 * @param circuitPath The subpath to the circuit file (e.g.
 *     test/batchProcessMessage_test.circom)
 */
const compileAndLoadCircuit = async (
    circuitPath: string
) => {

    const circuit = await circom.tester(
        path.join(
            __dirname,
            `../circom/${circuitPath}`,
        ),
    )

    await circuit.loadSymbols()

    return circuit
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

const genBatchUstProofAndPublicSignals = (
    inputs: any,
    configType: string,
    circuit?: any
) => {

    let circuitPath
    let circuitR1csPath
    let wasmPath
    let paramsPath
    if (configType === 'test') {
        circuitPath = 'test/batchUpdateStateTree_test.circom'
        circuitR1csPath = 'batchUstCircuit.r1cs'
        wasmPath = 'batchUst.wasm'
        paramsPath = 'batchUst.params'
    } else if (configType === 'prod-small') {
        circuitPath = 'prod/batchUpdateStateTree_small.circom'
        circuitR1csPath = 'batchUstSmall.r1cs'
        wasmPath = 'batchUstSmall.wasm'
        paramsPath = 'batchUstSmall.params'
    } else {
        throw new Error('Only test and prod-small circuits are supported')
    }

    return genProofAndPublicSignals(
        inputs,
        circuitPath,
        circuitR1csPath,
        wasmPath,
        paramsPath,
        circuit,
    )
}

const genQvtProofAndPublicSignals = (
    inputs: any,
    configType: string,
    circuit?: any,
) => {
    let circuitPath
    let circuitR1csPath
    let wasmPath
    let paramsPath
    if (configType === 'test') {
        circuitPath = 'test/quadVoteTally_test.circom'
        circuitR1csPath = 'qvtCircuit.r1cs'
        wasmPath = 'qvt.wasm'
        paramsPath = 'qvt.params'
    } else if (configType === 'prod-small') {
        circuitPath = 'prod/quadVoteTally_small.circom'
        circuitR1csPath = 'qvtSmallCircuit.r1cs'
        wasmPath = 'qvtSmall.wasm'
        paramsPath = 'qvtSmall.params'
    } else {
        throw new Error('Only test and prod-small circuits are supported')
    }

    return genProofAndPublicSignals(
        inputs,
        circuitPath,
        circuitR1csPath,
        wasmPath,
        paramsPath,
        circuit,
    )
}

const genProofAndPublicSignals = async (
    inputs: any,
    circuitFilename: string,
    circuitR1csFilename: string,
    circuitWasmFilename: string,
    paramsFilename: string,
    circuit?: any,
) => {
    const date = Date.now()
    const paramsPath = path.join(__dirname, '../build/', paramsFilename)
    const circuitR1csPath = path.join(__dirname, '../build/', circuitR1csFilename)
    const circuitWasmPath = path.join(__dirname, '../build/', circuitWasmFilename)
    const inputJsonPath = path.join(__dirname, '../build/' + date + '.input.json')
    const witnessPath = path.join(__dirname, '../build/' + date + '.witness.wtns')
    const witnessJsonPath = path.join(__dirname, '../build/' + date + '.witness.json')
    const proofPath = path.join(__dirname, '../build/' + date + '.proof.json')
    const publicJsonPath = path.join(__dirname, '../build/' + date + '.publicSignals.json')

    fs.writeFileSync(inputJsonPath, JSON.stringify(stringifyBigInts(inputs)))

    if (!circuit) {
        circuit = await compileAndLoadCircuit(circuitFilename)
    }

    const snarkjsCmd = 'node ' + path.join(__dirname, '../node_modules/snarkjs/build/cli.cjs')
    const witnessCmd = `${snarkjsCmd} wc ${circuitWasmPath} ${inputJsonPath} ${witnessPath}`

    shell.config.fatal = true
    shell.exec(witnessCmd)

    const witnessJsonCmd = `${snarkjsCmd} wej ${witnessPath} ${witnessJsonPath}`
    shell.exec(witnessJsonCmd)

    const proveCmd = `${zkutilPath} prove -c ${circuitR1csPath} -p ${paramsPath} -w ${witnessJsonPath} -r ${proofPath} -o ${publicJsonPath}`

    shell.exec(proveCmd)

    const witness = unstringifyBigInts(JSON.parse(fs.readFileSync(witnessJsonPath).toString()))
    const publicSignals = unstringifyBigInts(JSON.parse(fs.readFileSync(publicJsonPath).toString()))
    const proof = JSON.parse(fs.readFileSync(proofPath).toString())

    await circuit.checkConstraints(witness)

    shell.rm('-f', witnessPath)
    shell.rm('-f', witnessJsonPath)
    shell.rm('-f', proofPath)
    shell.rm('-f', publicJsonPath)
    shell.rm('-f', inputJsonPath)

    return { proof, publicSignals, witness, circuit }
}

const verifyProof = async (
    paramsFilename: string,
    proofFilename: string,
    publicSignalsFilename: string,
): Promise<boolean> => {
    const paramsPath = path.join(__dirname, '../build/', paramsFilename)
    const proofPath = path.join(__dirname, '../build/', proofFilename)
    const publicSignalsPath = path.join(__dirname, '../build/', publicSignalsFilename)

    const verifyCmd = `${zkutilPath} verify -p ${paramsPath} -r ${proofPath} -i ${publicSignalsPath}`
    const output = shell.exec(verifyCmd).stdout.trim()

    shell.rm('-f', proofPath)
    shell.rm('-f', publicSignalsPath)

    return output === 'Proof is correct'
}

const verifyBatchUstProof = (
    proof: any,
    publicSignals: any,
    configType: string,
) => {
    const date = Date.now().toString()
    let paramsFilename
    let proofFilename
    let publicSignalsFilename

    if (configType === 'test') {
        paramsFilename = 'batchUst.params'
        proofFilename = `${date}.batchUst.proof.json`
        publicSignalsFilename = `${date}.batchUst.publicSignals.json`
    } else if (configType === 'prod-small') {
        paramsFilename = 'batchUstSmall.params'
        proofFilename = `${date}.batchUstSmall.proof.json`
        publicSignalsFilename = `${date}.batchUstSmall.publicSignals.json`
    }

    fs.writeFileSync(
        path.join(__dirname, '../build/', proofFilename),
        JSON.stringify(
            stringifyBigInts(proof)
        )
    )

    fs.writeFileSync(
        path.join(__dirname, '../build/', publicSignalsFilename),
        JSON.stringify(
            stringifyBigInts(publicSignals)
        )
    )

    return verifyProof(paramsFilename, proofFilename, publicSignalsFilename)
}

const verifyQvtProof = (
    proof: any,
    publicSignals: any,
    configType: string,
) => {
    const date = Date.now().toString()
    let paramsFilename
    let proofFilename
    let publicSignalsFilename

    if (configType === 'test') {
        paramsFilename = 'qvt.params'
        proofFilename = `${date}.qvt.proof.json`
        publicSignalsFilename = `${date}.qvt.publicSignals.json`
    } else if (configType === 'prod-small') {
        paramsFilename = 'qvtSmall.params'
        proofFilename = `${date}.qvtSmall.proof.json`
        publicSignalsFilename = `${date}.qvtSmall.publicSignals.json`
    }

    // TODO: refactor
    fs.writeFileSync(
        path.join(__dirname, '../build/', proofFilename),
        JSON.stringify(
            stringifyBigInts(proof)
        )
    )

    fs.writeFileSync(
        path.join(__dirname, '../build/', publicSignalsFilename),
        JSON.stringify(
            stringifyBigInts(publicSignals)
        )
    )

    return verifyProof(paramsFilename, proofFilename, publicSignalsFilename)
}

export {
    compileAndLoadCircuit,
    executeCircuit,
    getSignalByName,
    genBatchUstProofAndPublicSignals,
    genQvtProofAndPublicSignals,
    verifyBatchUstProof,
    verifyQvtProof,
    genProofAndPublicSignals,
    verifyProof,
}
