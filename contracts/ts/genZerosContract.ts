import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

import {
    hashLeftRight,
} from 'maci-crypto'

const genZerosContract = (
    contractName: string,
    zeroVal: BigInt,
    numZeros: number,
    comment: string,
): string => {

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
        const hashed = hashLeftRight(z, z)
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
    const numZeros = Number(process.argv[4])
    const comment = process.argv[5]

    const generated = genZerosContract(
        contractName,
        zero,
        numZeros,
        comment,
    )
    console.log(generated)
}

export {
    genZerosContract,
}
