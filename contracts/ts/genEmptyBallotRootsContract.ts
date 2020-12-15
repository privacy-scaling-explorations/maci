import * as fs from 'fs'
import * as path from 'path'

import {
    hashLeftRight,
    IncrementalQuinTree,
} from 'maci-crypto'

const genEmptyBallotRootsContract = (
): string => {

    const template = fs.readFileSync(
        path.join(
            __dirname,
            '..',
            'ts',
            'EmptyBallotRoots.sol.template',
        ),
    ).toString()

    let r = ''
    for (let i = 1; i < 6; i ++) {
        // The empty vote option tree
        const voTree = new IncrementalQuinTree(i, BigInt(0), 5)

        // The empty Ballot tree leaf
        const z = hashLeftRight(BigInt(0), voTree.root)

        // The empty Ballot tree root
        const ballotTree = new IncrementalQuinTree(10, BigInt(z), 5)
        const root = ballotTree.root

        r += `        emptyBallotRoots[${i-1}] = uint256(${root});\n`

    }

    const generated = template
        .replace('<% ROOTS %>', r)
    return generated
}


if (require.main === module) {
    const generated = genEmptyBallotRootsContract()
    console.log(generated)
}

export {
    genEmptyBallotRootsContract,
}
