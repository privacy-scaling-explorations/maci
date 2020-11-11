import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

import {
    hashLeftRight,
    hash5,
} from 'maci-crypto'

const genZerosContract = (
    contractName: string,
    zeroVal: BigInt,
    hashLength: number,
    numZeros: number,
    comment: string,
): string => {

    assert(hashLength === 2 || hashLength === 5)

    const template = fs.readFileSync(
        path.join(
            __dirname,
            '..',
            'ts',
            'MerkleZeros.sol.template',
        ),
    ).toString()

    const zeros: BigInt[] = [zeroVal]
    for (let i = 1; i < numZeros; i ++) {
        const z = zeros[i - 1]
        let hashed: BigInt
        if (hashLength === 2) {
            hashed = hashLeftRight(z, z)
        } else {
            hashed = hash5([z, z, z, z, z])
        }
        zeros.push(hashed)
    }

    let z = ''
    for (let i = 0; i < zeros.length; i ++) {
        z += `        zeros[${i}] = uint256(${zeros[i]});\n`
    }

    const generated = template
        .replace('<% CONTRACT_NAME %>', contractName)
        .replace('<% NUM_ZEROS %>', numZeros.toString())
        .replace('<% ZEROS %>', '        ' + z.trim())
        .replace('<% COMMENT %>', comment)
    
    return generated
}


if (require.main === module) {
    const contractName = process.argv[2]
    const zero = BigInt(process.argv[3])
    const hashLength = Number(process.argv[4])
    const numZeros = Number(process.argv[5])
    const comment = process.argv[6]

    const generated = genZerosContract(contractName, zero, hashLength, numZeros, comment)
    console.log(generated)
}

export {
    genZerosContract,
}
