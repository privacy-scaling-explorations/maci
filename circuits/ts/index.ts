import * as fs from 'fs'
import * as assert from 'assert'
import * as lineByLine from 'n-readlines'
import * as path from 'path'
const circom = require('circom')
import * as shell from 'shelljs'

import {
    stringifyBigInts,
    unstringifyBigInts,
} from 'maci-crypto'

import { config } from 'maci-config'
const zkutilPath = config.zkutil_bin
const snarkParamsPath = path.isAbsolute(config.snarkParamsPath)
    ? config.snarkParamsPath
    : path.resolve(__dirname, config.snarkParamsPath)

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

const getSignalByNameViaSym = (
    circuitName: any,
    witness: any,
    signal: string,
) => {
    const symPath = path.join(snarkParamsPath, `${circuitName}.sym`)
    const liner = new lineByLine(symPath)
    let line
    let index
    let found = false

    while (true) {
        line = liner.next()
        if (!line) { break }
        const s = line.toString().split(',')
        if (signal === s[3]) {
            index = s[1]
            found = true
            break
        }
    }

    assert(found)

    return witness[index]
}

const genBatchUstProofAndPublicSignals = (
    inputs: any,
    configType: string,
) => {

    let circuitPath
    let circuitR1csPath
    let circuitWitnessGenFilename
    let wasmPath
    let paramsPath
    if (configType === 'test') {
        circuitPath = 'test/batchUpdateStateTree_test.circom'
        circuitR1csPath = 'batchUstCircuit.r1cs'
        circuitWitnessGenFilename = 'batchUst'
        wasmPath = 'batchUst.wasm'
        paramsPath = 'batchUst.params'
    } else if (configType === 'prod-small') {
        circuitPath = 'prod/batchUpdateStateTree_small.circom'
        circuitR1csPath = 'batchUstSmall.r1cs'
        circuitWitnessGenFilename = 'batchUstSmall'
        paramsPath = 'batchUstSmall.params'
        wasmPath = 'batchUstSmall.wasm'
    } else if (configType === 'prod-medium') {
        circuitPath = 'prod/batchUpdateStateTree_medium.circom'
        circuitR1csPath = 'batchUstMedium.r1cs'
        circuitWitnessGenFilename = 'batchUstMedium'
        paramsPath = 'batchUstMedium.params'
        wasmPath = 'batchUstMedium.wasm'
    } else {
        throw new Error('Only test, prod-small, and prod-medium circuits are supported')
    }

    return genProofAndPublicSignals(
        inputs,
        circuitPath,
        circuitR1csPath,
        circuitWitnessGenFilename,
        wasmPath,
        paramsPath,
        false,
    )
}

const genQvtProofAndPublicSignals = (
    inputs: any,
    configType: string,
) => {
    let circuitPath
    let circuitR1csPath
    let circuitWitnessGenFilename
    let wasmPath
    let paramsPath
    if (configType === 'test') {
        circuitPath = 'test/quadVoteTally_test.circom'
        circuitR1csPath = 'qvtCircuit.r1cs'
        circuitWitnessGenFilename = 'qvt'
        wasmPath = 'qvt.wasm'
        paramsPath = 'qvt.params'
    } else if (configType === 'prod-small') {
        circuitPath = 'prod/quadVoteTally_small.circom'
        circuitR1csPath = 'qvtCircuitSmall.r1cs'
        circuitWitnessGenFilename = 'qvtSmall'
        wasmPath = 'qvtSmall.wasm'
        paramsPath = 'qvtSmall.params'
    } else if (configType === 'prod-medium') {
        circuitPath = 'prod/quadVoteTally_medium.circom'
        circuitR1csPath = 'qvtCircuitMedium.r1cs'
        circuitWitnessGenFilename = 'qvtMedium'
        wasmPath = 'qvtMedium.wasm'
        paramsPath = 'qvtMedium.params'
    } else {
        throw new Error('Only test, prod-small, and prod-medium circuits are supported')
    }

    return genProofAndPublicSignals(
        inputs,
        circuitPath,
        circuitR1csPath,
        circuitWitnessGenFilename,
        wasmPath,
        paramsPath,
        false,
    )
}

const genProofAndPublicSignals = async (
    inputs: any,
    circuitFilename: string,
    circuitR1csFilename: string,
    circuitWitnessGenFilename: string,
    wasmFilename: string,
    paramsFilename: string,
    compileCircuit = true,
) => {
    const date = Date.now()
    const paramsPath = path.join(snarkParamsPath, paramsFilename)
    const circuitR1csPath = path.join(snarkParamsPath, circuitR1csFilename)
    const witnessGenExe = path.join(snarkParamsPath, circuitWitnessGenFilename)
    const circuitWasmPath = path.join(snarkParamsPath, wasmFilename)
    const inputJsonPath = path.join(snarkParamsPath, date + '.input.json')
    const witnessPath = path.join(snarkParamsPath, date + '.witness.wtns')
    const witnessJsonPath = path.join(snarkParamsPath, date + '.witness.json')
    const proofPath = path.join(snarkParamsPath, date + '.proof.json')
    const publicJsonPath = path.join(snarkParamsPath, date + '.publicSignals.json')

    fs.writeFileSync(inputJsonPath, JSON.stringify(stringifyBigInts(inputs)))

    //let circuit
    //if (compileCircuit) {	
        //circuit = await compileAndLoadCircuit(circuitFilename)	
    //}

    const snarkjsDir = path.dirname(require.resolve('snarkjs'))
    const snarkjsCmd = 'node ' + path.join(snarkjsDir, 'cli.cjs')

    const witnessCmd = `${snarkjsCmd} wc ${circuitWasmPath} ${inputJsonPath} ${witnessPath}`
    //const witnessCmd = `${witnessGenExe} ${inputJsonPath} ${witnessJsonPath}`

    shell.config.fatal = true
    shell.exec(witnessCmd)

    const witnessJsonCmd = `${snarkjsCmd} wej ${witnessPath} ${witnessJsonPath}`

    //const witnessGenStart = Date.now()
    shell.exec(witnessJsonCmd)
    //const witnessGenEnd = Date.now()
    //console.log('Witness generation took', (witnessGenEnd - witnessGenStart) / 1000, 'seconds')

    const proveCmd = `${zkutilPath} prove -c ${circuitR1csPath} -p ${paramsPath} -w ${witnessJsonPath} -r ${proofPath} -o ${publicJsonPath}`

    //const proveStart = Date.now()
    shell.exec(proveCmd)
    //const proveEnd = Date.now()
    //console.log('Proof generation took', (proveEnd - proveStart) / 1000, 'seconds')

    const witness = unstringifyBigInts(JSON.parse(fs.readFileSync(witnessJsonPath).toString()))
    const publicSignals = unstringifyBigInts(JSON.parse(fs.readFileSync(publicJsonPath).toString()))
    const proof = JSON.parse(fs.readFileSync(proofPath).toString())

    shell.rm('-f', witnessPath)
    shell.rm('-f', witnessJsonPath)
    shell.rm('-f', proofPath)
    shell.rm('-f', publicJsonPath)
    shell.rm('-f', inputJsonPath)

    return { 
        //circuit,
        proof,
        publicSignals,
        witness,
    }
}

const verifyProof = async (
    paramsFilename: string,
    proofFilename: string,
    publicSignalsFilename: string,
): Promise<boolean> => {
    const paramsPath = path.join(snarkParamsPath, paramsFilename)
    const proofPath = path.join(snarkParamsPath, proofFilename)
    const publicSignalsPath = path.join(snarkParamsPath, publicSignalsFilename)

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
    } else if (configType === 'prod-medium') {
        paramsFilename = 'batchUstMedium.params'
        proofFilename = `${date}.batchUstMedium.proof.json`
        publicSignalsFilename = `${date}.batchUstMedium.publicSignals.json`
    }

    fs.writeFileSync(
        path.join(snarkParamsPath, proofFilename),
        JSON.stringify(
            stringifyBigInts(proof)
        )
    )

    fs.writeFileSync(
        path.join(snarkParamsPath, publicSignalsFilename),
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
    } else if (configType === 'prod-medium') {
        paramsFilename = 'qvtMedium.params'
        proofFilename = `${date}.qvtMedium.proof.json`
        publicSignalsFilename = `${date}.qvtMedium.publicSignals.json`
    }

    // TODO: refactor
    fs.writeFileSync(
        path.join(snarkParamsPath, proofFilename),
        JSON.stringify(
            stringifyBigInts(proof)
        )
    )

    fs.writeFileSync(
        path.join(snarkParamsPath, publicSignalsFilename),
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
    getSignalByNameViaSym,
    genBatchUstProofAndPublicSignals,
    genQvtProofAndPublicSignals,
    verifyBatchUstProof,
    verifyQvtProof,
    genProofAndPublicSignals,
    verifyProof,
}
