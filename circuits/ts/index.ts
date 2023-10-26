import * as fs from 'fs'
import * as path from 'path'
import * as shelljs from 'shelljs'
import * as tmp from 'tmp'
import { zKey, groth16 } from 'snarkjs'

import { stringifyBigInts } from 'maci-crypto'

/*
 * https://github.com/iden3/snarkjs/issues/152
 * Need to cleanup the threads to avoid stalling
 */
const cleanThreads = async () => {
    if (!globalThis) {
      return Promise.resolve(true)
    }

    const curves = ['curve_bn128', 'curve_bls12381']
    const promises = Promise.all(curves.map(curve => {
       return globalThis[curve]?.terminate? globalThis[curve]?.terminate() : null
    }).filter(Boolean))

    return promises
}

const genProof = (
    inputs: string[],
    rapidsnarkExePath: string,
    witnessExePath: string,
    zkeyPath: string,
    silent = true,
): any => {
    // Create tmp directory
    const tmpObj = tmp.dirSync()
    const tmpDirPath = tmpObj.name

    const inputJsonPath = path.join(tmpDirPath, 'input.json')
    const outputWtnsPath = path.join(tmpDirPath, 'output.wtns')
    const proofJsonPath = path.join(tmpDirPath, 'proof.json')
    const publicJsonPath = path.join(tmpDirPath, 'public.json')

    // Write input.json
    const jsonData = JSON.stringify(stringifyBigInts(inputs))
    fs.writeFileSync(inputJsonPath, jsonData)

    // Generate the witness
    const witnessGenCmd = `${witnessExePath} ${inputJsonPath} ${outputWtnsPath}`

    const witnessGenOutput = shelljs.exec(witnessGenCmd, { silent })
    if (witnessGenOutput.stderr) {
        console.log(witnessGenOutput.stderr)
    }

    if (!fs.existsSync(outputWtnsPath)) {
        console.error(witnessGenOutput.stderr)
        throw new Error('Error executing ' + witnessGenCmd)
    }

    // Generate the proof
    const proofGenCmd = `${rapidsnarkExePath} ${zkeyPath} ${outputWtnsPath} ${proofJsonPath} ${publicJsonPath}`
    shelljs.exec(proofGenCmd, { silent })

    if (!fs.existsSync(proofJsonPath)) {
        throw new Error('Error executing ' + proofGenCmd)
    }

    // Read the proof and public inputs
    const proof = JSON.parse(fs.readFileSync(proofJsonPath).toString())
    const publicInputs = JSON.parse(fs.readFileSync(publicJsonPath).toString())

    for (const f of [
        proofJsonPath,
        publicJsonPath,
        inputJsonPath,
        outputWtnsPath,
    ]) {
        if (fs.existsSync(f)) {
            fs.unlinkSync(f)
        }
    }
    tmpObj.removeCallback()

    return { proof, publicInputs }
}

const verifyProof = async (publicInputs: any, proof: any, vk: any) => {
    const isValid = await groth16.verify(vk, publicInputs, proof)
    await cleanThreads()
    return isValid
}

const extractVk = async (zkeyPath: string) => {
    const vk = await zKey.exportVerificationKey(zkeyPath)
    await cleanThreads()
    return vk
}

export { genProof, verifyProof, extractVk }
