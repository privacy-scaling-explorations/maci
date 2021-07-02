import * as fs from 'fs'
import * as path from 'path'
import * as shelljs from 'shelljs'
import * as tmp from 'tmp'

import { stringifyBigInts } from 'maci-crypto'

const snarkjsPath = path.join(
    __dirname,
    '..',
    './node_modules/snarkjs/cli.js',
)

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

    // Delete the temp files and the temp directory
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

const verifyProof = (
    publicInputs: any,
    proof: any,
    vk: any,
) => {
    // Create tmp directory
    const tmpObj = tmp.dirSync()
    const tmpDirPath = tmpObj.name

    const publicJsonPath = path.join(tmpDirPath, 'public.json')
    const proofJsonPath = path.join(tmpDirPath, 'proof.json')
    const vkJsonPath = path.join(tmpDirPath, 'vk.json')

    fs.writeFileSync(
        publicJsonPath,
        JSON.stringify(stringifyBigInts(publicInputs)),
    )

    fs.writeFileSync(
        proofJsonPath,
        JSON.stringify(stringifyBigInts(proof)),
    )

    fs.writeFileSync(
        vkJsonPath,
        JSON.stringify(stringifyBigInts(vk)),
    )

    const verifyCmd = `node ${snarkjsPath} g16v ${vkJsonPath} ${publicJsonPath} ${proofJsonPath}`
    const output = shelljs.exec(verifyCmd, { silent: true })
    const isValid = output.stdout && output.stdout.indexOf('OK!') > -1

    //// Generate calldata
    //const calldataCmd = `node ${snarkjsPath} zkesc ${publicJsonPath} ${proofJsonPath}`
    //console.log(shelljs.exec(calldataCmd).stdout)

    fs.unlinkSync(proofJsonPath)
    fs.unlinkSync(publicJsonPath)
    fs.unlinkSync(vkJsonPath)
    tmpObj.removeCallback()

    return isValid
}

const extractVk = (zkeyPath: string) => {
    // Create tmp directory
    const tmpObj = tmp.dirSync()
    const tmpDirPath = tmpObj.name
    const vkJsonPath = path.join(tmpDirPath, 'vk.json')

    const exportCmd = `node ${snarkjsPath} zkev ${zkeyPath} ${vkJsonPath}`
    shelljs.exec(exportCmd)

    const vk = JSON.parse(fs.readFileSync(vkJsonPath).toString())

    fs.unlinkSync(vkJsonPath)
    tmpObj.removeCallback()

    return vk
}

export {
    genProof,
    verifyProof,
    extractVk,
}
