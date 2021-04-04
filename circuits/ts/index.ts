import * as fs from 'fs'
import * as path from 'path'
import * as shelljs from 'shelljs'

import {
    stringifyBigInts,
} from 'maci-crypto'

import * as tmp from 'tmp'

const genProof = (
    inputs: string[],
    rapidsnarkExePath: string,
    witnessExePath: string,
    zkeyPath: string,
): any => {
    // Create tmp directory
    const tmpObj = tmp.dirSync()
    const tmpDirPath = tmpObj.name

    const inputJsonPath = path.join(tmpDirPath, 'input.json')
    const outputWtnsPath = path.join(tmpDirPath, 'output.wtns')
    const proofJsonPath = path.join(tmpDirPath, 'proof.json')
    const publicJsonPath = path.join(tmpDirPath, 'public.json')

    const jsonData = JSON.stringify(stringifyBigInts(inputs))
    fs.writeFileSync(inputJsonPath, jsonData)

    const witnessGenCmd = `${witnessExePath} ${inputJsonPath} ${outputWtnsPath}`
    shelljs.exec(witnessGenCmd)

    if (!fs.existsSync(outputWtnsPath)) {
        throw new Error('Error executing ' + witnessGenCmd)
    }

    const proofGenCmd = `${rapidsnarkExePath} ${zkeyPath} ${outputWtnsPath} ${proofJsonPath} ${publicJsonPath}`
    shelljs.exec(proofGenCmd)

    if (!fs.existsSync(proofJsonPath)) {
        throw new Error('Error executing ' + proofGenCmd)
    }

    const proof = JSON.parse(fs.readFileSync(proofJsonPath).toString())
    const publicJson = JSON.parse(fs.readFileSync(publicJsonPath).toString())

    fs.unlinkSync(proofJsonPath)
    fs.unlinkSync(publicJsonPath)
    fs.unlinkSync(inputJsonPath)
    fs.unlinkSync(outputWtnsPath)
    tmpObj.removeCallback()

    return { proof, publicJson }
}

export {
    genProof,
}
